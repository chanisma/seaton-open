import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillPeriods() {
  const startDate = '2026-01-05';
  const endDate = '2026-01-28';
  const targetPeriods = [1, 2, 3, 4];

  console.log(`Fetching reservations between ${startDate} and ${endDate}...`);

  // 1. Fetch all reservations in range
  // We need to fetch enough data to group.
  // Pagination might be needed if there are many rows.
  let allReservations: any[] = [];
  let page = 0;
  const pageSize = 1000;

  const { count: totalCount } = await supabase
    .from('seat_reservations')
    .select('*', { count: 'exact', head: true });
  console.log(`Total rows in seat_reservations: ${totalCount}`);

  const { count: futureCount } = await supabase
    .from('seat_reservations')
    .select('*', { count: 'exact', head: true })
    .gte('reservation_date', '2026-01-01');
  console.log(`Rows in 2026+: ${futureCount}`);

  while (true) {
    const { data, error } = await supabase
      .from('seat_reservations')
      .select('*')
      .gte('reservation_date', startDate)
      .lte('reservation_date', endDate)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching reservations:', error);
      return;
    }

    if (!data || data.length === 0) break;
    allReservations = [...allReservations, ...data];
    if (data.length < pageSize) break;
    page++;
  }

  console.log(`Total reservations found: ${allReservations.length}`);

  // 2. Group by (student_id, room_id, seat_number, reservation_date)
  const groups = new Map<string, any[]>();

  for (const r of allReservations) {
    // Key: student_id|room_id|seat_number|reservation_date
    const key = `${r.student_id}|${r.room_id}|${r.seat_number}|${r.reservation_date}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)?.push(r);
  }

  console.log(`Total groups found: ${groups.size}`);

  if (groups.size > 0) {
    const firstKey = groups.keys().next().value;
    console.log('Sample group key:', firstKey);
    console.log('Sample group records:', groups.get(firstKey));
  }

  const toInsert: any[] = [];

  // 3. Check for missing periods
  for (const [key, records] of groups) {
    // If we have records with period_id = 0 (all day), we might skip?
    // User said "period가 1, 2, 3, 4 가 있어야 하는데 없는 것들이 있음".
    // If there is a 0, maybe we should convert it or ignore?
    // Assuming we only care about cases where we expect 1,2,3,4.
    // If there is a 0, it usually means "All Day".
    // Let's check if any record has period_id 0.
    const hasAllDay = records.some(r => r.period_id === 0);
    if (hasAllDay) {
      // If it's all day, do we need to expand it to 1,2,3,4?
      // User request implies they expect 4 records.
      // If there is 1 record with 0, maybe we should leave it or the user wants to split it?
      // "reservation_date가 ... 인 레코드를 분석해서 ... 4개가 아닌 경우 ... 추가로 생성"
      // This implies we should fill the gaps.
      // If there is a 0, it counts as 1 record. 1 < 4.
      // But if 0 exists, maybe we shouldn't add 1,2,3,4?
      // Let's assume for now we only target cases where we have some of 1,2,3,4 but not all.
      // Or if we have 0, maybe we should delete 0 and insert 1,2,3,4?
      // Let's stick to: if we have existing periods from {1,2,3,4}, fill the rest.
      // If we have 0, we'll log it but maybe skip for safety unless user clarifies.
      // Actually, looking at previous context, 0 is used for "All Day" or "Default".
      // If the user says "period 1,2,3,4 should be there", likely they are migrating from 0 to 1,2,3,4 or fixing broken partial inserts.

      // Let's check existing period IDs.
      const existingPeriods = new Set(records.map(r => r.period_id));

      // If we have 0, and count < 4.
      if (existingPeriods.has(0)) {
        // If we have 0, it covers everything conceptually.
        // But maybe the user wants explicit 1,2,3,4 records.
        // Let's assume we skip groups with 0 for now to avoid duplication/conflict,
        // UNLESS the user specifically meant "convert 0 to 1,2,3,4" or "fix where 0 is missing and only some 1,2,3,4 exist".
        // The prompt says "period가 1, 2, 3, 4 가 있어야 하는데 없는 것들이 있음" (There should be 1, 2, 3, 4 but some are missing).
        // This strongly suggests we are dealing with partial sets like {1, 2} or {1} or {2, 3, 4}.
        continue;
      }

      const missingPeriods = targetPeriods.filter(p => !existingPeriods.has(p));

      if (missingPeriods.length > 0) {
        // Prepare new records
        // We can copy metadata from the first record in the group
        const template = records[0];

        for (const pid of missingPeriods) {
          toInsert.push({
            student_id: template.student_id,
            room_id: template.room_id,
            seat_number: template.seat_number,
            reservation_date: template.reservation_date,
            period_id: pid,
            is_attended: false, // Default to false? Or copy? Let's default to false or template.is_attended?
            // If the user attended "partially", maybe they attended the whole day?
            // Let's copy is_attended from the template to be safe/consistent?
            // Or maybe false is safer. Let's use false for now as these are "missing".
            // Actually, if I booked period 1 and attended, and I'm backfilling 2,3,4,
            // maybe I haven't attended those yet?
            // Let's use `false` for is_attended to be safe.
            created_at: new Date().toISOString(), // Current time
          });
        }
      }
    } else {
      // No 0, check for 1,2,3,4
      const existingPeriods = new Set(records.map(r => r.period_id));
      const missingPeriods = targetPeriods.filter(p => !existingPeriods.has(p));

      if (missingPeriods.length > 0) {
        const template = records[0];
        for (const pid of missingPeriods) {
          toInsert.push({
            student_id: template.student_id,
            room_id: template.room_id,
            seat_number: template.seat_number,
            reservation_date: template.reservation_date,
            period_id: pid,
            is_attended: false, // Default to false
            created_at: new Date().toISOString(),
          });
        }
      }
    }
  }

  console.log(`Found ${toInsert.length} missing records to insert.`);

  if (toInsert.length > 0) {
    // Insert in batches
    const batchSize = 100;
    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize);
      const { error } = await supabase.from('seat_reservations').insert(batch);
      if (error) {
        console.error('Error inserting batch:', error);
      } else {
        console.log(
          `Inserted batch ${i / batchSize + 1}/${Math.ceil(toInsert.length / batchSize)}`
        );
      }
    }
    console.log('Backfill complete.');
  } else {
    console.log('No records to insert.');
  }
}

backfillPeriods().catch(console.error);
