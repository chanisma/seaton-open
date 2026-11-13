-- 집중 세션 포인트 적립을 위해 point_transactions.type CHECK 제약 확장
ALTER TABLE point_transactions
  DROP CONSTRAINT IF EXISTS point_transactions_type_check;

ALTER TABLE point_transactions
  ADD CONSTRAINT point_transactions_type_check
  CHECK (type IN ('attendance', 'review', 'puzzle_unlock', 'focus'));
