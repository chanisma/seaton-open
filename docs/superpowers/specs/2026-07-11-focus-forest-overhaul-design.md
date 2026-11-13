# Focus Forest 오버홀 — 통합 로우폴리 3D 씬 디자인

> 작성일: 2026-07-11
> 상태: 승인됨 (구현 계획 대기)

## 목적

Focus Forest를 현대적인 표현 방식으로 전면 재구성하고, "학생의 집중을 돕는다"는 목적에
맞게 방해 요소를 제거한다.

현재 구현의 문제:

- 픽셀아트 SVG 나무(2D) 위에 동물마다 개별 three.js Canvas(3D GLB)가 떠 있어
  시각적으로 이질적이고, WebGL 컨텍스트가 동물 수만큼 생성되어 성능 부담이 크다.
- 동물이 30초~2분마다 말풍선 대사를 띄우고 등장/퇴장 토스트가 수시로 팝업되는 등,
  집중 보조가 아니라 주의를 끄는 설계다.
- ForestCanvas(819줄)가 props를 ref로 미러링하는 패턴 8곳 등 setInterval 클로저
  우회책으로 복잡도가 높다.

## 결정 사항 요약

| 항목 | 결정 |
| --- | --- |
| 비주얼 방향 | 통합 로우폴리 3D 씬 (단일 R3F Canvas) |
| 집중 기능 | 방해 최소화 + 세션 목표(뽀모도로) |
| 범위 | 전체 오버홀 (씬·시작 화면·HUD·오버레이·모달 3종) |
| 아키텍처 | R3F 선언형 전면 재작성, 시뮬레이션 로직은 훅으로 분리 |
| 데이터 | 기존 localStorage 포맷 완전 호환 (무손실) |
| 신규 의존성 | 없음 (three / @react-three/fiber / @react-three/drei 기설치) |

## 섹션 1 — 3D 씬 (ForestScene)

### 월드

- 원형 로우폴리 언덕 섬: 정점 지터를 준 flat-shading 지형, 가장자리는 안개로 소멸.
- 기존 `TreePosition`의 x·y(0~100 %)를 평면 좌표로 선형 매핑:
  `worldX = (x - 50) / 100 * WORLD_SIZE`, `worldZ = (y - 50) / 100 * WORLD_SIZE`.
  기존에 키우던 숲이 3D로 그대로 이어진다.
- 중앙 클리어링(빈 공간) 개념과 "중심에서 바깥으로 성장" 배치 규칙은 유지.

### 카메라

- 3/4 부감 고정 시점 (고도각 약 55°), 매우 느린 자동 궤도 드리프트 (한 바퀴 12분 이상).
- 사용자 카메라 조작 비활성 — 집중 모드에서 만질 거리를 없앤다.

### 나무

- 프로시저럴 로우폴리 지오메트리 4계열: 침엽수(겹친 콘), 활엽수(다면체 캐노피),
  관목(낮은 반구), 묘목(작은 콘+줄기).
- 기존 `TreeType` 5종 매핑: large→활엽수(대), medium→침엽수, small→활엽수(소),
  bush→관목, sapling→묘목. variant(0~7)로 크기·색조 지터.
- 타입별 `InstancedMesh` 렌더링 — 120그루를 draw call 몇 개로 처리.
- 성장 연출: scale 0→1 ease-out + 미세 오버슈트. 성장 규칙(3분당 1그루,
  90초 완전 성장, 120그루 완성)은 기존 수치 유지.

### 낮/밤 사이클

- 10분 주기 유지 (dawn 0s / day 140s / sunset 300s / night 440s).
- 색 오버레이 대신 실제 조명 전환: 하늘 그라디언트·태양/달 방향광 색과 강도·
  안개색을 시간에 따라 lerp.
- 밤에는 반딧불이 포인트 스프라이트 표시.

### 동물

- 기존 GLB 24종(`public/GLB format/`, 총 3.3MB)을 단일 씬 안에서 렌더.
  개별 Canvas 제거 → WebGL 컨텍스트 1개.
- 스폰 규칙 유지: 숲 단계별 목표 마릿수(small 2 / medium 3 / large 4),
  나무 수에 따른 희귀도 해금, 3~5분 체류.
- 움직임은 긴 정지 + 가끔 느린 이동 위주. GLB 내장 idle 애니메이션 재생.

### 렌더 품질

- 방향광 소프트 섀도 1개 (shadow map 1024, 타이트한 frustum).
- 포스트프로세싱 없음. dpr [1, 2] 제한.

## 섹션 2 — 집중 보조 메커니즘

### 방해 최소화

- 동물 말풍선 제거. `animalDialogues` 데이터는 세션 종료 요약의
  "동물의 한마디"로 재활용.
- 동물 등장/퇴장 토스트(AnimalToast) 제거 → 종료 요약의 "이번 세션에 다녀간 동물"
  목록으로 이동. 새 동물 발견도 세션 종료 시 공개 (보상은 세션 끝에 몰아주기).
- 숲 완성(120그루) 시 세션 중 모달을 띄우지 않는다. 씬에서 은은한 골든 파티클
  연출 후 조용히 다음 숲으로 전환하고, 축하는 종료 요약에서.
- HUD는 평소 저대비로 가라앉고 마우스 움직임 감지 시 3초간 선명해진다.

### 세션 목표 (뽀모도로)

- 시작 화면에서 목표 시간 선택: 25분 / 50분 / 90분 / 무제한.
- 목표 도달 시: 씬이 골든아워 조명으로 전환되고 완료 카드 표시 →
  "휴식하기(5분 권장 안내)" 또는 "계속하기" 선택.
- HUD에 목표 진행률 링 + 오늘 완료한 세션 수 도트 표시.
- 목표 설정값은 `FocusForestData`에 새 필드로 저장 (기존 필드 변경 없음).

### 세션 종료 요약 (SessionSummary, 신규)

전체화면 종료 시 표시. 집중 시간 · 심은 나무 수 · 만난 동물(새 발견 강조) ·
동물 한마디(대사 1개 랜덤) · 숲 진행률(n/120)을 한 화면에. 보상의 핵심 순간.

## 섹션 3 — 컴포넌트 아키텍처

```
src/components/focus-forest/
├── scene/
│   ├── ForestScene.tsx       # <Canvas> 진입점 (구 ForestCanvas 대체)
│   ├── Terrain.tsx           # 로우폴리 지형
│   ├── Trees.tsx             # InstancedMesh 렌더러
│   ├── treeGeometries.ts     # 프로시저럴 지오메트리 팩토리
│   ├── Animals.tsx           # GLB 동물 (단일 씬 내부)
│   ├── SkyAndLights.tsx      # 낮/밤 하늘·조명·안개 lerp
│   └── Fireflies.tsx         # 야간 반딧불이
├── useForestSimulation.ts    # 성장·스폰·완성 규칙 (렌더와 분리)
├── FocusHud.tsx              # 타이머 + 진행 링 (구 FocusTimer 대체)
├── SessionSummary.tsx        # 세션 종료 요약 (신규)
├── FocusOverlay.tsx          # 일시정지 오버레이 (리디자인)
├── ForestMap.tsx             # 숲 목록 (리디자인)
├── AnimalCollection.tsx      # 동물 도감 (리디자인)
├── FocusStatistics.tsx       # 집중 기록 (리디자인)
└── index.ts
```

### 핵심 분리

- `useForestSimulation(elapsedSeconds, isFocusing, savedTrees, forestIndex)` 훅이
  나무 심기·성장·동물 스폰·숲 완성 규칙을 소유하고, 씬 컴포넌트는 결과를 그리기만
  한다. 순수 함수 위주로 작성해 향후 vitest 도입 시 바로 단위 테스트 가능하게.
- R3F `useFrame`은 매 프레임 최신 스코프에서 실행되므로 기존의 ref 미러링 패턴이
  필요 없어진다.

### 데이터 호환

- `TreePosition`, `CompletedForest`, `AnimalCollection`, `DailyRecord` 및
  `useFocusForestData` 저장 포맷 전부 유지 — 기존 사용자 데이터 무손실.
- 추가 필드: 세션 목표 시간(분), 오늘 완료 세션 수. 기본값으로 하위 호환.

### 삭제 대상

- `assets/` SVG 픽셀 나무·자연물·동물 18파일
- `Animal3DModel.tsx` (Animals.tsx로 흡수), `AnimalToast.tsx` (요약으로 대체)
- `forest-bg.png` 배경 의존

## 섹션 4 — 주변 UI (새 디자인 언어)

- 디자인 토큰: 딥포레스트 그린 + 크림/스카이 보조색, 큰 라운드, 넉넉한 여백,
  다크모드 유지.
- 시작 화면: 현재 숲의 라이브 미니 3D 프리뷰 카드(저해상도, `frameloop="demand"`)
  + 목표 시간 세그먼트 + 시작 버튼 + 통계 3카드 + 네비 3버튼 재스타일.
- ForestMap: 카드 미리보기를 정적 미니 3D 스냅샷으로 교체
  (WebGL 불가 시 기존 SVG 점 방식 폴백).
- AnimalCollection: 희귀도별 그룹핑, 미발견 동물은 실루엣 처리.
- FocusStatistics: 레이아웃 유지, 새 토큰 적용.
- 관리자 배속 컨트롤(1~60x): 그대로 유지.

## 섹션 5 — 에러 처리 & 검증

### 에러 처리

- Canvas를 ErrorBoundary로 감싼다. WebGL 컨텍스트 생성 실패/로스 시 안내 카드를
  표시하되 타이머·기록 기능은 계속 동작한다 (집중 기록은 씬 없이도 유효).
- GLB 로드 실패: 동물별 Suspense + ErrorBoundary — 실패한 동물만 조용히 스킵.

### 검증 (테스트 프레임워크 부재)

- `tsc -b` (주의: 이 저장소에서 `tsc --noEmit`은 거짓 통과) + `npm run lint`.
- 개발 서버에서 관리자 배속 60x로 실측: 나무 성장 → 동물 스폰 → 낮/밤 전환 →
  숲 완성 전환 → 목표 달성 카드 → 종료 요약 플로우.
- 기존 저장 데이터(savedTrees 보유 상태)로 접속해 좌표 매핑 호환 확인.
