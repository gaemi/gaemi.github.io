# AGENTS.md

`gaemi.github.io`는 개인 소개·채널 인덱스, 글(블로그) 렌더링, 그리고 운영 중인 앱의 공개 정책 페이지를 호스팅하는 정적 사이트(Astro) 저장소입니다.

## Opinions (Why & What)

- **코드와 블로그 콘텐츠의 분리**: 이 저장소에는 사이트 코드·디자인·정적 정책 문서만 둡니다. 모든 블로그 글 원문과 에셋은 별도의 비공개 저장소 `gaemi/writing` (로컬 기본 경로 `../writing/posts`, CI `.writing/posts`)에서만 관리합니다.
- **절제된 에디토리얼 톤**: 과장된 마케팅 히어로, 그라데이션 배너, 불필요한 장식 카드를 지양합니다. 여백, 헤어라인(1px rule), 타이포그래피 위계만으로 정돈된 인상을 유지합니다.
- **단일 디자인 토큰 소스 (`tokens.css`)**: 색상(OKLCH, 따뜻한 지면 톤 + 반려견 하네스에서 가져온 파인 틸 포인트), 서체, 간격, 모션은 루트 `tokens.css`에 정의하며 컴포넌트에 임의 색상·폰트 값을 하드코딩하지 않습니다.
- **포인트 캐릭터 활용**: 반려견 픽셀 일러스트(`public/mascot/*`)는 인장(seal)이나 빈 상태의 포인트 요소로 절제해 사용합니다. 원본(`src/assets/mascot/*`)을 교체하거나 변형할 때는 `npm run mascot:prepare`로 투명 배경 및 파비콘을 재생성합니다.
- **노출 범위 규율**:
  - 프로필 및 외부 채널 링크의 단일 소스는 `src/data/site.ts`입니다. 메인 소개는 회사명·세부 이력을 나열하지 않고 가볍고 담백한 톤을 유지합니다.
  - 포트폴리오·제품 컬렉션 스키마(`src/content.config.ts`의 `work`, `src/content/work/`)는 향후 확장을 위해 예약되어 있으나, 명시적인 요청 전까지 네비게이션이나 화면에 노출하지 않습니다.

## Invariants & Deterministic Tooling

반드시 동일하게 동작해야 하는 규칙은 스크립트와 로더로 강제합니다.

1. **비공개 글·에셋 유출 원천 차단**
   - `src/content.config.ts`의 `writing-blog-loader`는 로컬 `npm run dev`에서는 `private`·`published` 글을 모두 실시간 반영하지만, 프로덕션 빌드 시점에는 `status: published`가 아닌 글과 상대 이미지 에셋을 콘텐츠 스토어에서 즉시 제거합니다.
   - 이 저장소 내부(`src/content/blog`)에는 마크다운 글을 직접 추가하지 않습니다.

2. **기존 외부 공개 경로 보존**
   - `public/apps/**` 아래의 정적 문서(예: `/apps/use-trail/privacy/`)는 외부 스토어 및 앱에서 참조하는 라이브 계약이므로 경로와 접근성을 항상 유지합니다.

3. **사전 검증**
   - 작업 완료 및 PR 생성 전 `npm run verify`를 실행해 타입·스키마 검사(`astro check`), 프로덕션 빌드, 비공개 글·이미지 유출 차단 및 필수 정적 경로 보존(`scripts/verify-build.mjs`)을 검증합니다.
