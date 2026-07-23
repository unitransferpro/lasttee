# 라스트티 (LastTee) — 팀 온보딩

취소된 골프 티타임을 할인가로 참여하는 라스트미닛 마켓플레이스 PWA (한국어).

- **라이브:** https://unitransferpro.github.io/lasttee/
- **저장소:** github.com/unitransferpro/lasttee (public, GitHub Pages는 `main` 루트에서 서빙)
- **현재 버전:** v1.16 (릴리즈 준비 상태)

## 무엇인가
필드 골프는 4인 예약이 원칙이라 한 명이 취소하면 남은 사람이 위약금을 떠안습니다. 라스트티는 그 빈자리를 할인가로 양도/참여하게 연결합니다. 스크린골프·골프연습장은 정보 조회 전용입니다(결제 없음).

## 스택 (빌드 없음)
- 바닐라 HTML/CSS/JS 단일 페이지 앱. 번들러/프레임워크 없음.
- 폰트/아이콘 CDN: Pretendard(한글 본문) + Archivo(숫자·워드마크) + Phosphor(아이콘).
- PWA: `sw.js` 서비스워커 + `manifest.webmanifest`.
- 상태: `localStorage` (백엔드 미연결 시). 백엔드는 Cloudflare Worker(`worker/`).

## 파일 지도
- `index.html` — 앱 셸, 스크립트/스타일 로드, 탭바.
- `app.js` — 라우터 + 모든 뷰 렌더 + 로직 (가장 큼).
- `data.js` — 골프장 큐레이션 + 데모 호스트/모집/크루/구독 시드.
- `venues.js` — 전국 골프장·스크린 디렉토리 897곳 (자동 생성물).
- `geo.js` — 실측 한국 지도 경로 + 골프장 좌표 (자동 생성물).
- `styles.css` — 디자인 시스템 + 모션 레이어.
- `api.js` — Cloudflare 백엔드 클라이언트 (`window.LT_API` 비면 데모 모드).
- `worker/` — 백엔드 Worker + `wrangler.toml` + `SETUP.md` + `test.mjs`.
- `make_geo.mjs` / `make_venues.mjs` / `make_csv.mjs` — geo.js/venues.js 재생성 노드 스크립트(OSM + 공시 CSV).

## 로컬 실행
```bash
python3 -m http.server 8934 --directory .
# http://localhost:8934 접속
```
빌드 단계 없음. 파일 저장 후 새로고침.

## 배포 (GitHub Pages)
`main`에 push하면 자동 반영됩니다.
**⚠️ 캐시버스팅 규칙 (필수):** 에셋(css/js) 수정 시 `index.html`과 `sw.js`의 `?v=N`을 **함께** 올리고 `sw.js`의 `const VER`도 올려야 사용자에게 반영됩니다. 안 올리면 서비스워커가 옛 파일을 계속 서빙합니다.

## 백엔드 (선택, 아직 미배포)
`worker/SETUP.md` 참고. 요약: `wrangler login` → `wrangler kv namespace create LT_KV`(id를 wrangler.toml에) → `wrangler deploy` → `api.js`의 `window.LT_API`를 배포 주소로. 그 전까지는 앱이 로컬 데모로 자동 폴백합니다.

## 코드 컨벤션 (지켜주세요)
- **한국어 UI.** 카피에 em 대시(—) 금지, 이모지 금지 (커스텀 SVG 글리프 + Phosphor 아이콘만).
- **가짜 정보 금지.** 골프장 데이터는 공시/OSM 실측만. 데모 마켓플레이스 콘텐츠(예시 모집·호스트)는 "예시/지난 사례"로 명확히 라벨.
- 접근성: `prefers-reduced-motion` 존중, 포커스 링 유지.
- 애니메이션은 transform/opacity(GPU)만.

## 현재 상태 (v1.16)
- 시드 모집 16건 = "지난 매칭 사례"(참여 불가), 실시간 목록은 실사용자 모집만(현재 0건).
- 스크린골프·골프연습장 = 정보 조회 전용(결제 제거).
- 채팅 자동응답 제거됨. 백엔드 코드는 완성됐으나 미배포.
- **다음 작업:** 백엔드 배포 후 프론트 Store 읽기/쓰기를 실서버(api.js)로 연결하는 통합.

## 함정 (경험칙)
- 프리뷰 브라우저에서 `getComputedStyle(document.body).backgroundColor`는 신뢰 불가(뷰포트 캔버스로 전파). body 스타일 검증은 스크린샷으로.
- 한 저장소를 여러 Claude 세션이 동시 편집하면 서로 덮어씁니다. 한 번에 한 세션만.
