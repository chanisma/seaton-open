# Seaton - 학교 열람실 자리 신청 시스템

학생들이 학교 열람실(자습 공간) 자리를 주 단위로 신청하고, 교사가 출석을 관리하는 웹 애플리케이션입니다.

## 🚀 시작하기

### 필수 요구사항

- Node.js 20.x 이상
- npm 또는 yarn
- Supabase 계정

### 설치

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 열고 Supabase 정보를 입력하세요

# 개발 서버 실행
npm run dev
```

### 환경 변수

`.env.local` 파일에 다음 환경 변수를 설정하세요:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### MCP 설정 (선택적)

Claude Code와 함께 개발하는 경우 Supabase MCP 서버를 설정할 수 있습니다:

```bash
# MCP 설정 파일 생성
cp .mcp.json.example .mcp.json
```

`.mcp.json` 파일을 열고 다음 정보를 입력하세요:
- `YOUR_SUPABASE_PROJECT_REF`: Supabase 프로젝트 참조 ID
- `YOUR_SUPABASE_ACCESS_TOKEN`: Supabase 액세스 토큰

**참고**: `.mcp.json` 파일은 민감한 정보를 포함하므로 Git에 커밋되지 않습니다.

## 📚 기술 스택

### Frontend
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **React Router** - 라우팅
- **Zustand** - 상태 관리
- **date-fns** - 날짜 처리

### Backend & Database
- **Supabase** - BaaS 플랫폼
- **PostgreSQL** - 데이터베이스
- **Supabase Auth** - Google OAuth 인증

## 🎯 주요 기능

### 학생 기능
- Google 계정으로 로그인 (@myschool.hs.kr)
- 주 단위 자리 신청
- 내 신청 내역 확인
- 출석 기록 조회

### 교사 기능
- 실시간 자리 현황 조회
- 출석 체크
- 통계 대시보드

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── auth/           # 인증 관련 컴포넌트
│   ├── common/         # 공통 컴포넌트
│   ├── student/        # 학생용 컴포넌트
│   └── teacher/        # 교사용 컴포넌트
├── hooks/              # 커스텀 훅
├── lib/                # 라이브러리 설정
├── pages/              # 페이지 컴포넌트
├── services/           # API 서비스
├── store/              # 상태 관리
├── types/              # TypeScript 타입 정의
└── utils/              # 유틸리티 함수
```

## 🔧 개발 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 린트 실행
npm run lint

# 타입 체크
npm run type-check
```

## 📝 개발 진행 상황

### ✅ 완료된 기능

- [x] 프로젝트 초기 설정
- [x] Tailwind CSS 커스텀 테마 구성
- [x] TypeScript 타입 정의
- [x] Supabase 클라이언트 설정
- [x] 인증 시스템 (Google OAuth)
- [x] 라우팅 설정
- [x] 기본 레이아웃 및 페이지

### 🚧 진행 중

- [ ] 자리 신청 시스템
- [ ] 출석 체크 기능
- [ ] 통계 대시보드

자세한 로드맵은 [CLAUDE.md](./CLAUDE.md)를 참조하세요.

## 라이선스

[SPACEKIJUN 교육용 비상업 라이선스 1.0](LICENSE)

- **학교 안 활용은 자유롭습니다.** 학교(국공립·사립)와 교직원·학생이 수업·학교 업무·학생 활동에 쓰고, 자기 학교에 맞게 고치고, 학교 서버나 교육청 클라우드에 설치해 운영할 수 있습니다. 교육청·교사 연구회·비영리 교육 단체가 고친 것을 다른 학교와 나누는 것도 자유입니다.
- **상용 서비스 제작에는 쓸 수 없습니다.** 유료 판매·구독 상품, 영리 목적의 웹 서비스·앱(수익 방식 불문), 영리 기업 제품이나 사교육 상품에 넣는 것은 저작권자의 서면 허락이 필요합니다.
- 외부에서 가져온 코드·자료는 각자의 라이선스를 따릅니다.

## 🤝 기여

이슈나 PR은 언제든 환영합니다!
