-- ============================================
-- 이벤트 포인트 & 퍼즐 시스템 테이블
-- ============================================

-- 1. 퍼즐 이벤트 테이블
CREATE TABLE IF NOT EXISTS puzzle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  grid_size TEXT NOT NULL CHECK (grid_size IN ('3x4', '4x3')),
  total_pieces INTEGER NOT NULL DEFAULT 12,
  piece_cost INTEGER NOT NULL DEFAULT 10,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_piece_cost CHECK (piece_cost > 0)
);

ALTER TABLE puzzle_events ENABLE ROW LEVEL SECURITY;

-- 모든 인증 사용자가 활성 이벤트 조회 가능
CREATE POLICY "Authenticated users can view active puzzle events"
  ON puzzle_events FOR SELECT
  USING (auth.role() = 'authenticated');

-- 교사/관리자만 이벤트 생성/수정/삭제 가능
CREATE POLICY "Teachers can manage puzzle events"
  ON puzzle_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- 2. 퍼즐 조각 테이블
CREATE TABLE IF NOT EXISTS puzzle_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES puzzle_events(id) ON DELETE CASCADE,
  piece_index INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(event_id, piece_index)
);

ALTER TABLE puzzle_pieces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view puzzle pieces"
  ON puzzle_pieces FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers can manage puzzle pieces"
  ON puzzle_pieces FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- 3. 포인트 트랜잭션 테이블
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('attendance', 'review', 'puzzle_unlock')),
  reference_id TEXT,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_point_transactions_student ON point_transactions(student_id);
CREATE INDEX idx_point_transactions_type ON point_transactions(type);
CREATE INDEX idx_point_transactions_reference ON point_transactions(reference_id);

ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- 학생은 자신의 트랜잭션만 조회 가능
CREATE POLICY "Students can view own point transactions"
  ON point_transactions FOR SELECT
  USING (student_id = auth.uid());

-- 교사/관리자는 모든 트랜잭션 조회 가능
CREATE POLICY "Teachers can view all point transactions"
  ON point_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- 시스템(서비스)에서 트랜잭션 생성 (인증된 사용자)
CREATE POLICY "Authenticated users can create own transactions"
  ON point_transactions FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- 4. 학생 퍼즐 진행도 테이블
CREATE TABLE IF NOT EXISTS student_puzzle_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES puzzle_events(id) ON DELETE CASCADE,
  piece_index INTEGER NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(student_id, event_id, piece_index)
);

CREATE INDEX idx_puzzle_progress_student_event ON student_puzzle_progress(student_id, event_id);

ALTER TABLE student_puzzle_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own puzzle progress"
  ON student_puzzle_progress FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can create own puzzle progress"
  ON student_puzzle_progress FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view all puzzle progress"
  ON student_puzzle_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- 5. 학생 퍼즐 컬렉션 테이블 (완성된 퍼즐 소장)
CREATE TABLE IF NOT EXISTS student_puzzle_collection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES puzzle_events(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(student_id, event_id)
);

CREATE INDEX idx_puzzle_collection_student ON student_puzzle_collection(student_id);

ALTER TABLE student_puzzle_collection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own puzzle collection"
  ON student_puzzle_collection FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can add to own puzzle collection"
  ON student_puzzle_collection FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view all puzzle collections"
  ON student_puzzle_collection FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- 6. 포인트 잔액 조회 함수
CREATE OR REPLACE FUNCTION get_student_points(p_student_id UUID)
RETURNS TABLE(total_earned INTEGER, total_spent INTEGER, balance INTEGER)
LANGUAGE sql STABLE
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)::INTEGER AS total_earned,
    COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0)::INTEGER AS total_spent,
    COALESCE(SUM(amount), 0)::INTEGER AS balance
  FROM point_transactions
  WHERE student_id = p_student_id;
$$;

-- 7. 출석 시 자동 포인트 부여 트리거
CREATE OR REPLACE FUNCTION grant_attendance_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points INTEGER;
  v_description TEXT;
  v_ref_id TEXT;
BEGIN
  -- 출석 상태가 변경되었을 때만 처리
  IF OLD.attendance_status IS DISTINCT FROM NEW.attendance_status THEN
    v_ref_id := NEW.id::TEXT;

    -- 이전 출석 포인트가 있으면 제거
    IF OLD.attendance_status = 'attended' THEN
      DELETE FROM point_transactions
      WHERE reference_id = v_ref_id
        AND type = 'attendance';
    END IF;

    -- 출석일 때만 포인트 부여 (공결은 포인트 없음)
    IF NEW.attendance_status = 'attended' THEN
      v_points := 10;
      v_description := '출석 포인트';

      INSERT INTO point_transactions (student_id, amount, type, reference_id, description)
      VALUES (NEW.student_id, v_points, 'attendance', v_ref_id, v_description);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 출석 체크 시 자동 포인트 부여 트리거
DROP TRIGGER IF EXISTS trigger_grant_attendance_points ON seat_reservations;
CREATE TRIGGER trigger_grant_attendance_points
  AFTER UPDATE OF attendance_status ON seat_reservations
  FOR EACH ROW
  EXECUTE FUNCTION grant_attendance_points();

-- 8. 리뷰(피드백) 작성 시 자동 포인트 부여 트리거
CREATE OR REPLACE FUNCTION grant_review_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ref_id TEXT;
BEGIN
  -- 피드백이 새로 작성되었을 때만 (NULL → 값)
  IF OLD.feedback_rating IS NULL AND NEW.feedback_rating IS NOT NULL THEN
    v_ref_id := NEW.id::TEXT;

    -- 이미 리뷰 포인트를 받았는지 확인
    IF NOT EXISTS (
      SELECT 1 FROM point_transactions
      WHERE reference_id = v_ref_id AND type = 'review'
    ) THEN
      INSERT INTO point_transactions (student_id, amount, type, reference_id, description)
      VALUES (NEW.student_id, 3, 'review', v_ref_id, '리뷰 작성 포인트');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_grant_review_points ON seat_reservations;
CREATE TRIGGER trigger_grant_review_points
  AFTER UPDATE OF feedback_rating ON seat_reservations
  FOR EACH ROW
  EXECUTE FUNCTION grant_review_points();

-- 9. Supabase Storage 버킷 (SQL로는 생성 불가, Dashboard에서 생성 필요)
-- 버킷명: puzzle-images
-- 공개 접근: true (이미지 조회용)
-- 허용 MIME: image/jpeg, image/png, image/webp
-- 최대 파일 크기: 5MB
