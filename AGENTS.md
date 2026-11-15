# AGENTS.md

`gaemi.github.io`는 개인 소개·채널 인덱스, 글(블로그) 아카이브, 그리고 운영 중인 앱의 공개 정책 페이지를 호스팅하는 정적 사이트(Astro)입니다.

## Opinions (Why & What)

- **절제된 에디토리얼 톤**: 과장된 마케팅 히어로, 그라데이션 배너, 불필요한 장식 카드를 지양합니다. 여백, 헤어라인(1px rule), 타이포그래피 위계만으로 정돈된 인상을 유지합니다.
- **단일 디자인 토큰 소스 (`tokens.css`)**: 색상(OKLCH, 따뜻한 지면 톤 + 반려견 하네스에서 가져온 파인 틸 포인트), 서체, 간격, 모션은 루트 `tokens.css`에 정의하며 컴포넌트에 임의 색상·폰트 값을 하드코딩하지 않습니다.
- **포인트 캐릭터 활용**: 반려견 픽셀 일러스트(`public/mascot/*`)는 시선을 압도하는 배너가 아니라 인장(seal)이나 빈 상태의 포인트 요소로 절제해 사용합니다. 원본(`src/assets/mascot/*`)을 교체하거나 변형할 때는 `npm run mascot:prepare`로 투명 배경 및 파비콘을 일관되게 재생성합니다.
- **노출 범위 규율**:
  - 프로필 및 외부 채널 링크의 단일 소스는 `src/data/site.ts`입니다. 메인 소개는 회사명·세부 이력을 나열하지 않고 가볍고 담백한 톤을 유지합니다.
  - 포트폴리오·제품 컬렉션 스키마(`src/content.config.ts`의 `work`, `src/content/work/`)는 향후 확장을 위해 예약되어 있으나, 명시적인 요청 전까지 네비게이션이나 화면에 노출하지 않습니다.

## Invariants & Deterministic Tooling

반드시 동일하게 동작해야 하는 규칙은 문서가 아닌 스크립트로 강제합니다.

1. **블로그 공개 단계 (GitHub Pages 운영 특성 반영)**
   - `private` (`src/content/blog/private/*.md`): `.gitignore`로 Git 추적 자체가 차단되며 로컬 `npm run dev`에서만 보입니다. 저장소 공개 시에도 초안 원문이 노출되지 않도록 하기 위한 기본값입니다.
   - `draft` (`src/content/blog/*.md`, `status: draft`): 브랜치·PR 공유가 필요할 때 사용하며 프로덕션 빌드에서는 제외됩니다.
   - `published` (`src/content/blog/*.md`, `status: published`): 실제 사이트, RSS, Sitemap에 배포됩니다.
   - 생성 및 승격은 `npm run post:new -- <slug>`와 `npm run post:release -- <slug>`를 사용합니다.

2. **기존 외부 공개 경로 보존**
   - `public/apps/**` 아래의 정적 문서(예: `/apps/use-trail/privacy/`)는 외부 스토어 및 앱에서 직접 참조하는 라이브 계약이므로 경로와 접근성을 항상 유지합니다.

3. **사전 검증**
   - 작업 완료 및 PR 생성 전 `npm run verify`를 실행해 타입·스키마 검사(`astro check`), 프로덕션 빌드, 비공개 글 유출 차단 및 필수 정적 경로 보존(`scripts/verify-build.mjs`)을 검증합니다.
