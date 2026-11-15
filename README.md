# gaemi.github.io

Personal index, blog renderer, and static app policy pages at [gaemi.github.io](https://gaemi.github.io).

Blog posts live in the separate private repository `gaemi/writing` (mounted locally from `../writing/posts`, and in CI via read-only deploy key `WRITING_DEPLOY_KEY`).

## Commands

```bash
npm run dev            # 로컬 개발 서버 (../writing 의 private/published 글 실시간 미리보기)
npm run verify         # 타입 검사 + 프로덕션 빌드 + 비공개 글/에셋 유출 및 정적 경로 검증
npm run mascot:prepare # 반려견 캐릭터 컷아웃·파비콘 재생성
```

## Public App Pages

- UseTrail Privacy Policy: `https://gaemi.github.io/apps/use-trail/privacy/`

설계 의도와 불변 규칙은 [`AGENTS.md`](./AGENTS.md)를 참고하세요.
