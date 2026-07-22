# 라스트티 백엔드 켜기 (Cloudflare Workers + KV)

정적 앱은 지금도 데모 모드로 동작합니다. 아래를 마치면 실계정·실모집·알림이 켜집니다.
Worker는 API 전용이라 GitHub Pages 앱은 그대로 두고 **추가로** 붙는 구조입니다.

## 1. 로그인 (한 번만)
```bash
cd worker
npx wrangler login        # 브라우저로 Cloudflare 인증
```

## 2. KV 네임스페이스 생성
```bash
npx wrangler kv namespace create LT_KV
```
출력된 `id = "..."`를 `worker/wrangler.toml`의 `REPLACE_WITH_KV_ID` 자리에 붙여넣습니다.

## 3. 배포
```bash
npx wrangler deploy
```
배포되면 주소가 출력됩니다: `https://lasttee-api.<서브도메인>.workers.dev`
확인: `curl https://lasttee-api.<서브도메인>.workers.dev/api/v1/health` → `{"ok":true,"kv":true}`

## 4. 앱에 주소 연결
`api.js` 상단의 `window.LT_API`를 배포 주소 + `/api/v1`로 설정하고 push:
```js
window.LT_API = "https://lasttee-api.<서브도메인>.workers.dev/api/v1";
```
이후 앱은 `/health`가 `kv:true`면 실백엔드, 아니면 데모 모드로 자동 폴백합니다.

## GitHub Actions 자동 배포 (선택)
저장소 Settings → Secrets → Actions 에 추가하면 `worker/` 변경 시 자동 배포됩니다:
- `CLOUDFLARE_API_TOKEN` (권한: Workers Scripts:Edit, Workers KV Storage:Edit)
- `CLOUDFLARE_ACCOUNT_ID` (대시보드 우측 Account ID)

## 로컬 로직 검증
```bash
node worker/test.mjs      # KV 목킹으로 전체 흐름 검증 (18/18)
```

## API 요약 (`/api/v1`)
| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/auth/signup` | 프로필 생성 + 토큰 발급 |
| GET/PUT | `/me` | 내 프로필 조회/수정 (Bearer) |
| GET/POST | `/posts` | 열린 모집 목록 / 생성 |
| GET | `/posts/:id` | 상세 (멤버·신청자 프로필 포함) |
| POST | `/posts/:id/join` | 참여 (즉시확정 or 승인대기) |
| POST | `/posts/:id/approve` | 호스트 승인/거절 `{uid, ok}` |
| POST | `/posts/:id/cancel` `/close` | 참여 취소 / 모집 마감 |
| GET/POST | `/notifs` `/notifs/read` | 알림 조회 / 읽음 |
| GET | `/health` | 상태 + KV 바인딩 여부 |

## 다음 단계 (백엔드 배포 후)
`api.js`의 `LT.*` 메서드로 프론트의 Store 쓰기/읽기를 실서버에 연결하는 통합 작업.
지금은 `LT_API`가 비어 있어 앱이 100% 기존 데모 모드로 동작합니다.

## 미포함 (2단계)
채팅 DM, 크루 피드, 연습장 구독, 후기, 실기기 푸시(Web Push/FCM/APNs) — 코어 루프 안정화 후.
