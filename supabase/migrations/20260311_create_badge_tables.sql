-- 뱃지 정의 테이블
CREATE TABLE IF NOT EXISTS seaton_badge (
  id SERIAL PRIMARY KEY,
  temperature INTEGER NOT NULL UNIQUE, -- 필요 온도 (5, 10, 15, ..., 50)
  name TEXT NOT NULL,
  description TEXT NOT NULL, -- 격려 문구
  image_path TEXT NOT NULL, -- 이미지 경로 (예: /badges/5.png)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 뱃지 획득 기록 테이블
CREATE TABLE IF NOT EXISTS seaton_badge_acquire (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES seaton_badge(id) ON DELETE CASCADE,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, badge_id)
);

-- RLS 활성화
ALTER TABLE seaton_badge ENABLE ROW LEVEL SECURITY;
ALTER TABLE seaton_badge_acquire ENABLE ROW LEVEL SECURITY;

-- seaton_badge: 모든 인증 사용자가 조회 가능
CREATE POLICY "Anyone can view badges"
  ON seaton_badge FOR SELECT
  USING (auth.role() = 'authenticated');

-- seaton_badge_acquire: 학생은 자기 기록만 조회/생성 가능
CREATE POLICY "Students can view own badge acquisitions"
  ON seaton_badge_acquire FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can acquire badges"
  ON seaton_badge_acquire FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- 교사는 모든 기록 조회 가능
CREATE POLICY "Teachers can view all badge acquisitions"
  ON seaton_badge_acquire FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- 인덱스
CREATE INDEX idx_badge_acquire_student ON seaton_badge_acquire(student_id);
CREATE INDEX idx_badge_acquire_badge ON seaton_badge_acquire(badge_id);

-- 기본 뱃지 데이터 삽입
INSERT INTO seaton_badge (temperature, name, description, image_path) VALUES
  (25, '첫 발걸음', '작은 시작이 큰 변화를 만듭니다. 꾸준히 나아가세요!', '/badges/25.png'),
  (30, '성실한 학생', '열심히 노력하는 당신, 정말 멋집니다!', '/badges/30.png'),
  (35, '꾸준한 노력', '꾸준함은 최고의 재능입니다. 계속 이어가세요!', '/badges/35.png'),
  (40, '열정 가득', '당신의 열정이 주변을 밝히고 있어요!', '/badges/40.png'),
  (45, '모범 학생', '다른 친구들에게 좋은 본보기가 되고 있어요!', '/badges/45.png'),
  (50, '불꽃 의지', '뜨거운 의지로 목표를 향해 달려가세요!', '/badges/50.png'),
  (55, '자기주도 달인', '스스로 공부하는 습관이 완벽하게 자리잡았어요!', '/badges/55.png'),
  (60, '학습의 별', '반짝이는 노력이 빛나는 결과를 만들어내고 있어요!', '/badges/60.png'),
  (65, '전설의 시작', '전설적인 기록을 향한 여정이 시작되었습니다!', '/badges/65.png'),
  (70, '명예의 전당', '최고의 영예에 도달했습니다! 당신은 진정한 챔피언입니다!', '/badges/70.png')
ON CONFLICT (temperature) DO NOTHING;
