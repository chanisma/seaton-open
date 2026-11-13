-- 교사가 예약을 삭제할 수 있도록 RLS 정책 추가
CREATE POLICY "Teachers can delete reservations"
  ON seat_reservations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- 교사가 예약을 생성할 수 있도록 RLS 정책 추가
CREATE POLICY "Teachers can insert reservations"
  ON seat_reservations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );
