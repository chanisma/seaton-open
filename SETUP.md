# seaton 설치 안내 (공개판)

seaton 은 자습실 좌석 예약·출석 앱이다. **spacekijun 과 같은 Supabase DB 를 쓰는 별도 앱**이다.

## 1. DB 먼저
DB 구조의 정본은 [spacekijun-open](https://github.com/chanisma/spacekijun-open) 의 `supabase/schema/` 다(좌석·통계·지갑 SQL 포함).
그 저장소의 `SETUP.md` 대로 DB 를 먼저 세운다. 이 저장소의 `supabase/migrations/` 는 **개발 기록**이다. 이미 baseline 에 반영돼 있으니 다시 적용하지 말 것.

## 2. 학교 값 바꾸기
- 로그인 도메인: 코드·문서의 `myschool.hs.kr` 를 자기 학교 구글 워크스페이스 도메인으로 바꾼다(`src/` 에서 검색).
- 학생 판정: 이메일 앞부분이 학번(`NN-NNNNN`)인 계정을 학생으로 본다. 학교 규칙이 다르면 `isStudentEmail` 을 고친다.
- 순공 출석표 양식: `public/sungong_template.hwpx` 는 빈 양식이다. 학교 양식을 쓰려면 같은 표 구조(표1 머리 · 표2 출석표)를 유지한다.

## 3. 실행
```bash
cp .env.example .env    # URL·anon key 채우기
npm install
npm run dev
```
