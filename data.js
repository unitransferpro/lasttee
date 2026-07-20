/* ══════════ LASTTEE seed data v2 ══════════ */

const REGIONS = ["전체", "수도권", "강원", "충청", "호남", "영남", "제주"];

/* 커스텀 아바타 글리프 (24x24 stroke SVG) */
const AV_GLYPHS = [
  '<path d="M8 20V4l10 3-10 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><path d="M4 20h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  '<circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9.5" cy="10" r="1" fill="currentColor"/><circle cx="14.5" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="14" r="1" fill="currentColor"/>',
  '<circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M8.5 20h7M10 17h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  '<path d="M7 3l7 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><ellipse cx="15.5" cy="17.5" rx="4.5" ry="3" fill="none" stroke="currentColor" stroke-width="2"/>',
  '<path d="M7 4h10v4a5 5 0 0 1-10 0zM12 13v3M8 20h8M17 6h3v2a3 3 0 0 1-3 2M7 6H4v2a3 3 0 0 0 3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  '<path d="M5 14a7 6 0 0 1 14 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 14h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 8v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  '<rect x="8" y="7" width="8" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 7l1-4M14 7l-1-4M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  '<path d="M4 15h13l2-5h-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="8" cy="18" r="1.8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="18" r="1.8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 10V6h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  '<ellipse cx="12" cy="17" rx="8" ry="3.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 15V5l6 2-6 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
  '<path d="M3 13q4.5-7 9-1 4.5-7 9-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 18h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  '<path d="M3 19L9 8l4 6 4-8 4 13z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  '<path d="M13 2L5 14h5l-1 8 8-12h-5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
];
const CAREERS = ["입문 (1년 미만)", "구력 1~3년", "구력 3~7년", "구력 7~15년", "구력 15년+"];

/* 골프장 — 실제 위치(geo.js COURSE_GEO)와 실제 요금대 기준 */
const COURSES = [
  {
    id: "sky72", name: "클럽72 GC", eng: "Club72 (구 스카이72)", region: "수도권", city: "인천 중구",
    addr: "인천광역시 중구 운서동 (영종도)", open: 2005,
    type: "퍼블릭", holes: 72, par: 72, len: "6,932m", rating: 4.6, ratingN: 1284,
    green: { wd: 170000, we: 235000 }, caddy: 160000, cart: 100000,
    hue: 145, partner: true,
    tags: ["국내 최대 규모", "야간 라운드", "바다 조망"],
    facilities: ["클럽하우스", "드라이빙레인지", "사우나", "레스토랑", "프로샵", "연습그린"],
    desc: "인천공항 옆 국내 최대 퍼블릭. 스카이72로 문을 열어 2023년부터 클럽72로 운영됩니다. 하늘, 바다, 클래식, 레이크 4개 코스 72홀에 야간 라운드까지 가능한 수도권 대표 골프장입니다.",
  },
  {
    id: "bearcreek", name: "베어크리크 GC", eng: "Bear Creek Golf Club", region: "수도권", city: "경기 포천",
    addr: "경기도 포천시 관인면",
    type: "퍼블릭", holes: 36, par: 72, len: "6,911m", rating: 4.7, ratingN: 876,
    green: { wd: 160000, we: 220000 }, caddy: 150000, cart: 100000,
    hue: 130, partner: true,
    tags: ["명문 퍼블릭", "산악 코스", "코스 관리 최상"],
    facilities: ["클럽하우스", "골프텔", "사우나", "레스토랑", "프로샵"],
    desc: "포천의 명문 퍼블릭 36홀. 크리크와 베어 두 코스 모두 페어웨이 관리가 좋기로 유명하고, 가을 단풍 라운드는 수도권 최고로 꼽힙니다.",
  },
  {
    id: "lakeside", name: "레이크사이드 CC", eng: "Lakeside Country Club", region: "수도권", city: "경기 용인",
    addr: "경기도 용인시 처인구 모현읍", open: 1990,
    type: "회원제", holes: 54, par: 72, len: "6,703m", rating: 4.5, ratingN: 933,
    green: { wd: 200000, we: 260000 }, caddy: 160000, cart: 100000,
    hue: 155,
    tags: ["서울 30분", "54홀", "호수 전망"],
    facilities: ["클럽하우스", "사우나", "레스토랑", "연습그린", "프로샵"],
    desc: "서울에서 가장 가까운 대형 골프장 중 하나. 동, 서, 남 3개 코스 54홀 규모이며 호수를 낀 남코스 마지막 홀들이 시그니처입니다.",
  },
  {
    id: "wellington", name: "웰링턴 CC", eng: "Wellington Country Club", region: "수도권", city: "경기 이천",
    addr: "경기도 이천시 모가면",
    type: "회원제", holes: 27, par: 72, len: "7,258m", rating: 4.9, ratingN: 412,
    green: { wd: 250000, we: 330000 }, caddy: 180000, cart: 120000,
    hue: 140,
    tags: ["프리미엄", "챔피언십 코스", "대회 개최"],
    facilities: ["클럽하우스", "사우나", "파인다이닝", "프로샵", "연습장"],
    desc: "이천의 하이엔드 코스. 와이번, 그리핀, 피닉스 27홀 구성으로 프로 대회가 열리는 챔피언십 세팅과 압도적인 클럽하우스로 유명합니다.",
  },
  {
    id: "oakvalley", name: "오크밸리 GC", eng: "Oak Valley Golf Club", region: "강원", city: "강원 원주",
    addr: "강원특별자치도 원주시 지정면",
    type: "회원제", holes: 36, par: 72, len: "6,801m", rating: 4.4, ratingN: 758,
    green: { wd: 150000, we: 210000 }, caddy: 150000, cart: 100000,
    hue: 135, partner: true,
    tags: ["리조트 병설", "산악 뷰", "골프텔"],
    facilities: ["리조트", "골프텔", "사우나", "레스토랑", "스키장"],
    desc: "원주 오크밸리 리조트 안의 36홀. 산 능선을 따라 도는 레이아웃으로 여름에도 시원하고, 리조트 숙박 패키지 조합이 좋습니다.",
  },
  {
    id: "seolhaeone", name: "설해원 GC", eng: "Seolhaeone", region: "강원", city: "강원 양양",
    addr: "강원특별자치도 양양군 손양면",
    type: "퍼블릭", holes: 27, par: 72, len: "6,858m", rating: 4.8, ratingN: 351,
    green: { wd: 180000, we: 250000 }, caddy: 160000, cart: 100000,
    hue: 160,
    tags: ["동해 오션뷰", "온천", "리조트"],
    facilities: ["리조트", "온천", "레스토랑", "프로샵", "연습그린"],
    desc: "양양 바닷가의 리조트형 27홀. 동해가 보이는 홀들과 라운드 후 온천이 시그니처입니다. 서핑 성지 양양이라 여름 수요가 특히 많습니다.",
  },
  {
    id: "goldenbay", name: "골든베이 GC", eng: "Golden Bay Golf and Resort", region: "충청", city: "충남 태안",
    addr: "충청남도 태안군 근흥면",
    type: "회원제", holes: 27, par: 72, len: "7,012m", rating: 4.7, ratingN: 289,
    green: { wd: 190000, we: 250000 }, caddy: 170000, cart: 100000,
    hue: 150, partner: true,
    tags: ["서해 오션뷰", "시사이드 코스", "노을 명소"],
    facilities: ["클럽하우스", "골프텔", "사우나", "레스토랑"],
    desc: "태안 바닷가에 붙은 시사이드 코스. 서해로 티샷하는 오션 홀과 노을 라운드가 유명해 한국의 페블비치로 불립니다.",
  },
  {
    id: "silkriver", name: "실크리버 CC", eng: "Silk River Country Club", region: "충청", city: "충북 청주",
    addr: "충청북도 청주시 인근 미호강변",
    type: "퍼블릭", holes: 27, par: 72, len: "6,655m", rating: 4.3, ratingN: 512,
    green: { wd: 130000, we: 180000 }, caddy: 150000, cart: 90000,
    hue: 125,
    tags: ["가성비", "강변 코스", "평지형"],
    facilities: ["클럽하우스", "사우나", "레스토랑", "프로샵"],
    desc: "미호강을 낀 평지형 27홀. 걷기 편한 레이아웃과 합리적인 그린피로 중부권 주중 라운드 수요가 많습니다.",
  },
  {
    id: "bluoneship", name: "블루원 상주 GC", eng: "Bluone Sangju", region: "영남", city: "경북 상주",
    addr: "경상북도 상주시",
    type: "퍼블릭", holes: 18, par: 72, len: "6,473m", rating: 4.2, ratingN: 405,
    green: { wd: 110000, we: 160000 }, caddy: 140000, cart: 90000,
    hue: 120,
    tags: ["가성비", "노캐디 선택", "초보 친화"],
    facilities: ["클럽하우스", "레스토랑", "프로샵"],
    desc: "노캐디 셀프 라운드를 선택할 수 있는 실속형 18홀. 부담 없는 그린피 덕분에 머리 올리기 코스로도 인기가 많습니다.",
  },
  {
    id: "southcape", name: "사우스케이프", eng: "South Cape Owners Club", region: "영남", city: "경남 남해",
    addr: "경상남도 남해군 창선면", open: 2013,
    type: "회원제", holes: 18, par: 72, len: "6,547m", rating: 4.9, ratingN: 502,
    green: { wd: 290000, we: 370000 }, caddy: 180000, cart: 120000,
    hue: 165,
    tags: ["세계 100대 코스", "절벽 오션 홀", "카일 필립스 설계"],
    facilities: ["클럽하우스", "호텔", "파인다이닝", "스파", "프로샵"],
    desc: "남해 절벽 위, 세계 100대 코스에 꼽히는 대한민국 대표 오션 코스. 카일 필립스가 설계했고 바다를 건너 치는 16번 파3는 한국 골퍼의 버킷리스트입니다.",
  },
  {
    id: "asiad", name: "아시아드 CC", eng: "Asiad Country Club", region: "영남", city: "부산 기장",
    addr: "부산광역시 기장군",
    type: "회원제", holes: 27, par: 72, len: "6,689m", rating: 4.4, ratingN: 618,
    green: { wd: 160000, we: 220000 }, caddy: 155000, cart: 100000,
    hue: 138,
    tags: ["부산 근교", "야간 라운드", "접근성"],
    facilities: ["클럽하우스", "사우나", "레스토랑", "연습장"],
    desc: "부산 도심에서 30분 거리의 27홀. 야간 라운드 시설이 좋아 퇴근 후 9홀 수요가 꾸준합니다.",
  },
  {
    id: "mooan", name: "무안 CC", eng: "Muan Country Club", region: "호남", city: "전남 무안",
    addr: "전라남도 무안군",
    type: "퍼블릭", holes: 36, par: 72, len: "6,712m", rating: 4.1, ratingN: 377,
    green: { wd: 100000, we: 150000 }, caddy: 140000, cart: 90000,
    hue: 128,
    tags: ["호남 가성비", "36홀", "무안공항 10분"],
    facilities: ["클럽하우스", "골프텔", "레스토랑"],
    desc: "호남 대표 실속 36홀. 겨울에도 잔디 상태가 좋아 시즌오프 원정 라운드로 유명합니다.",
  },
  {
    id: "pinebeach", name: "파인비치 GL", eng: "Pine Beach Golf Links", region: "호남", city: "전남 해남",
    addr: "전라남도 해남군 화원면",
    type: "회원제", holes: 18, par: 72, len: "6,395m", rating: 4.8, ratingN: 264,
    green: { wd: 200000, we: 270000 }, caddy: 170000, cart: 100000,
    hue: 158, partner: true,
    tags: ["정통 링크스", "리아스 해안", "오션 티샷"],
    facilities: ["클럽하우스", "리조트", "레스토랑", "프로샵"],
    desc: "해남 리아스식 해안을 그대로 살린 정통 링크스. 바다 건너로 티샷하는 파5가 시그니처이고 바람이 라운드의 절반입니다.",
  },
  {
    id: "pinx", name: "핀크스 GC", eng: "Pinx Golf Club", region: "제주", city: "제주 안덕",
    addr: "제주특별자치도 서귀포시 안덕면", open: 1999,
    type: "회원제", holes: 27, par: 72, len: "6,812m", rating: 4.8, ratingN: 690,
    green: { wd: 200000, we: 270000 }, caddy: 170000, cart: 110000,
    hue: 148, partner: true,
    tags: ["세계 100대 코스", "한라산 뷰", "제주 명문"],
    facilities: ["클럽하우스", "포도호텔", "파인다이닝", "프로샵"],
    desc: "한라산과 산방산 사이에 자리한 제주 명문 27홀. 세계 100대 코스에 선정된 바 있고 안개 낀 아침 라운드가 압권입니다.",
  },
  {
    id: "ora", name: "오라 CC", eng: "Ora Country Club", region: "제주", city: "제주시",
    addr: "제주특별자치도 제주시 오라동",
    type: "퍼블릭", holes: 36, par: 72, len: "6,602m", rating: 4.3, ratingN: 542,
    green: { wd: 130000, we: 180000 }, caddy: 150000, cart: 95000,
    hue: 132,
    tags: ["제주공항 15분", "한라산 뷰", "가성비"],
    facilities: ["클럽하우스", "사우나", "레스토랑"],
    desc: "제주공항에서 15분, 여행 일정에 끼워 넣기 가장 좋은 36홀. 바다와 한라산이 동시에 보이는 제주 입문 코스입니다.",
  },

  /* ── 스크린골프 매장 (kind: screen) ── */
  {
    id: "sc-gangnam", kind: "screen", name: "골프존파크 강남역점", eng: "Golfzon Park Gangnam", region: "수도권", city: "서울 강남",
    addr: "서울특별시 강남구 강남대로 인근", lat: 37.4979, lng: 127.0276,
    type: "스크린", brand: "골프존 투비전 플러스", brandShort: "골프존", rooms: 12, hoursOpen: "24시간",
    rating: 4.5, ratingN: 412, room: { day: 25000, night: 33000 }, game: 25000, practice: 15000,
    hue: 200, partner: true,
    tags: ["24시간", "좌타석 룸", "역세권"],
    facilities: ["좌타석 룸", "GDR 연습룸", "라운지", "파티룸", "주차 지원", "무인 시스템"],
    desc: "강남역 도보 3분, 24시간 운영하는 골프존파크. 투비전 플러스 12개 룸에 좌타석 전용 룸과 회식용 파티룸까지 갖춰 퇴근 후 게임 수요가 가장 많은 지점입니다.",
  },
  {
    id: "sc-hongdae", kind: "screen", name: "프렌즈 스크린 홍대점", eng: "Friends Screen Hongdae", region: "수도권", city: "서울 마포",
    addr: "서울특별시 마포구 양화로 인근", lat: 37.5573, lng: 126.9237,
    type: "스크린", brand: "카카오VX 프렌즈 스크린", brandShort: "카카오VX", rooms: 9, hoursOpen: "24시간",
    rating: 4.4, ratingN: 288, room: { day: 22000, night: 30000 }, game: 22000, practice: 13000,
    hue: 190,
    tags: ["심야 게임", "초보 친화", "감성 인테리어"],
    facilities: ["프렌즈 캐릭터 룸", "라운지", "음료 바", "무인 시스템"],
    desc: "홍대입구역 인근의 카카오VX 프렌즈 스크린. 캐주얼한 분위기라 머리 올리기 전 연습 게임과 심야 라운드로 인기가 많습니다.",
  },
  {
    id: "sc-pangyo", kind: "screen", name: "골프존파크 판교점", eng: "Golfzon Park Pangyo", region: "수도권", city: "경기 성남",
    addr: "경기도 성남시 분당구 판교역로 인근", lat: 37.3947, lng: 127.1112,
    type: "스크린", brand: "골프존 투비전 플러스", brandShort: "골프존", rooms: 10, hoursOpen: "06:00 ~ 24:00",
    rating: 4.6, ratingN: 357, room: { day: 24000, night: 32000 }, game: 24000, practice: 14000,
    hue: 195,
    tags: ["판교 직장인", "스킨스 게임", "GDR 레인지"],
    facilities: ["투비전 플러스 룸", "GDR 연습룸", "라운지", "주차"],
    desc: "판교 테크노밸리 직장인들의 퇴근 후 성지. 스킨스 내기 게임 모집이 활발하고 GDR 연습룸도 함께 운영합니다.",
  },
  {
    id: "sc-seomyeon", kind: "screen", name: "골프존파크 서면점", eng: "Golfzon Park Seomyeon", region: "영남", city: "부산 부산진",
    addr: "부산광역시 부산진구 중앙대로 인근", lat: 35.1578, lng: 129.0604,
    type: "스크린", brand: "골프존 투비전 플러스", brandShort: "골프존", rooms: 11, hoursOpen: "24시간",
    rating: 4.3, ratingN: 301, room: { day: 22000, night: 30000 }, game: 22000, practice: 13000,
    hue: 185,
    tags: ["24시간", "서면 중심가", "야간 인기"],
    facilities: ["좌타석 룸", "라운지", "음료 바", "무인 시스템"],
    desc: "서면 한복판의 24시간 골프존파크. 부산 나이트골프 크루의 우천 시 대체 라운드 장소로도 자주 쓰입니다.",
  },
  {
    id: "sc-dunsan", kind: "screen", name: "프렌즈 스크린 둔산점", eng: "Friends Screen Dunsan", region: "충청", city: "대전 서구",
    addr: "대전광역시 서구 둔산로 인근", lat: 36.3512, lng: 127.378,
    type: "스크린", brand: "카카오VX 프렌즈 스크린", brandShort: "카카오VX", rooms: 8, hoursOpen: "09:00 ~ 24:00",
    rating: 4.2, ratingN: 188, room: { day: 20000, night: 27000 }, game: 20000, practice: 12000,
    hue: 205,
    tags: ["둔산 중심", "가성비", "초보 친화"],
    facilities: ["프렌즈 캐릭터 룸", "라운지", "주차"],
    desc: "대전 둔산동의 프렌즈 스크린. 합리적인 룸비로 충청권 평일 저녁 게임 모임이 꾸준한 지점입니다.",
  },
  {
    id: "sc-jeju", kind: "screen", name: "골프존파크 제주연동점", eng: "Golfzon Park Jeju Yeondong", region: "제주", city: "제주시",
    addr: "제주특별자치도 제주시 연동", lat: 33.489, lng: 126.4983,
    type: "스크린", brand: "골프존 투비전 플러스", brandShort: "골프존", rooms: 7, hoursOpen: "10:00 ~ 02:00",
    rating: 4.3, ratingN: 144, room: { day: 20000, night: 27000 }, game: 20000, practice: 12000,
    hue: 198,
    tags: ["우천 대체", "여행객 환영", "신제주"],
    facilities: ["투비전 룸", "라운지", "주차"],
    desc: "신제주 연동의 골프존파크. 비 오는 날 필드 대신, 혹은 늦은 밤 한 게임 더 치고 싶은 여행객들이 즐겨 찾습니다.",
  },
];

/* 데모 유저 (호스트) — avatar: AV_GLYPHS 인덱스 */
const HOSTS = [
  {
    id: "h1", name: "박성진", avatar: 3, g: 0, gender: "남", age: "40대", career: "구력 12년", avg: 84,
    rounds: 214, temp: 4.9, verified: true, badges: ["시간약속왕", "버디메이커", "라운드 50회+"],
    intro: "주말 새벽 라운드 위주로 칩니다. 빠른 진행 좋아해요.",
    reviews: [
      { from: "김민재", stars: 5, text: "티오프 40분 전에 미리 와계셔서 여유있게 시작했어요. 진행도 빠르고 매너 최고.", when: "지난주" },
      { from: "이수현", stars: 5, text: "초보인 저를 배려해주시면서도 부담 안 주셔서 편했습니다.", when: "2주 전" },
      { from: "정우성", stars: 4, text: "실력도 매너도 좋으신 분. 다음에 또 함께 치고 싶어요.", when: "지난달" },
    ],
  },
  {
    id: "h2", name: "김지연", avatar: 1, g: 3, gender: "여", age: "30대", career: "구력 5년", avg: 92,
    rounds: 87, temp: 4.8, verified: true, badges: ["매너 그린", "포섬 요정"],
    intro: "분위기 좋은 라운드 지향! 스코어보다 즐겁게 치는 게 좋아요.",
    reviews: [
      { from: "박성진", stars: 5, text: "라운드 내내 분위기 메이커셨어요. 덕분에 즐거웠습니다.", when: "지난주" },
      { from: "최동혁", stars: 5, text: "약속한 더치 정산 깔끔하게 해주셨어요.", when: "3주 전" },
    ],
  },
  {
    id: "h3", name: "최동혁", avatar: 11, g: 1, gender: "남", age: "30대", career: "구력 8년", avg: 88,
    rounds: 132, temp: 4.7, verified: true, badges: ["새벽 티오프", "라운드 30회+"],
    intro: "기장, 부산권 위주. 퇴근 후 야간 9홀도 자주 갑니다.",
    reviews: [
      { from: "김지연", stars: 5, text: "부산 로컬 맛집까지 알려주신 최고의 호스트.", when: "2주 전" },
      { from: "한서윤", stars: 4, text: "진행 템포가 좋아서 편하게 쳤습니다.", when: "지난달" },
    ],
  },
  {
    id: "h4", name: "한서윤", avatar: 9, g: 2, gender: "여", age: "20대", career: "구력 3년", avg: 98,
    rounds: 41, temp: 4.6, verified: true, badges: ["떠오르는 싱글", "매너 그린"],
    intro: "필드 경험 쌓는 중이에요. 초보 환영 라운드 좋아합니다!",
    reviews: [
      { from: "이수현", stars: 5, text: "같이 치면서 서로 응원해주는 분위기라 좋았어요.", when: "지난주" },
    ],
  },
  {
    id: "h5", name: "정우성", avatar: 4, g: 4, gender: "남", age: "50대", career: "구력 20년", avg: 79,
    rounds: 486, temp: 5.0, verified: true, badges: ["싱글 핸디", "라운드 100회+", "시간약속왕"],
    intro: "20년차 싱글. 원포인트 부담 없이 물어보세요.",
    reviews: [
      { from: "박성진", stars: 5, text: "레전드. 스윙 봐주신 것만으로 그린피 값 했습니다.", when: "지난주" },
      { from: "김민재", stars: 5, text: "품격 있는 라운드가 뭔지 배웠습니다.", when: "지난달" },
    ],
  },
  {
    id: "h6", name: "이수현", avatar: 2, g: 5, gender: "여", age: "30대", career: "구력 2년", avg: 105,
    rounds: 18, temp: 4.5, verified: false, badges: ["새싹 골퍼"],
    intro: "머리 올린 지 2년! 즐겁게 배우면서 치고 있어요.",
    reviews: [
      { from: "한서윤", stars: 5, text: "긍정 에너지 만렙. 같이 치면 기분 좋아지는 분.", when: "2주 전" },
    ],
  },
  {
    id: "h7", name: "김민재", avatar: 6, g: 1, gender: "남", age: "40대", career: "구력 10년", avg: 86,
    rounds: 178, temp: 4.8, verified: true, badges: ["라운드 50회+", "버디메이커"],
    intro: "수도권 평일 라운드 자주 엽니다. 캐디피 정산 칼같이.",
    reviews: [
      { from: "정우성", stars: 5, text: "정산이 제일 깔끔한 호스트.", when: "지난주" },
    ],
  },
  {
    id: "h8", name: "오하늘", avatar: 0, g: 2, gender: "여", age: "40대", career: "구력 9년", avg: 89,
    rounds: 149, temp: 4.9, verified: true, badges: ["여성 라운드 호스트", "매너 그린"],
    intro: "여성 골퍼 라운드를 주로 엽니다. 편안한 분위기 보장!",
    reviews: [
      { from: "김지연", stars: 5, text: "여성끼리 편하게 칠 수 있어서 너무 좋았어요.", when: "지난주" },
    ],
  },
];

/* 모집 (day = 오늘 기준 +n일) — 비용은 주말 그린피 + 캐디피/카트비 1/N 기준 */
const POSTINGS = [
  {
    id: "p1", courseId: "sky72", hostId: "h1", day: 0, tee: "13:24", holes: 18,
    total: 4, joiners: ["h1", "h7", "h4"], normal: 299000, price: 155000,
    reason: "동반자 1명 당일 취소", instant: true, level: "누구나",
    tags: ["초보환영", "캐디 포함", "카트 포함"], genderPref: "무관",
    memo: "일행이 급한 일로 못 오게 됐습니다. 위약금 내느니 같이 즐겁게 치실 분! 그린피, 캐디피, 카트비 다 포함한 가격이에요.",
    ago: "32분 전",
  },
  {
    id: "p2", courseId: "lakeside", hostId: "h7", day: 0, tee: "15:41", holes: 18,
    total: 4, joiners: ["h7", "h5"], normal: 325000, price: 185000,
    reason: "2명 노쇼 확정", instant: true, level: "100타 이내",
    tags: ["빠른진행", "캐디 포함"], genderPref: "무관",
    memo: "두 자리 비었습니다. 오후 티오프라 반차 라운드로 딱이에요. 진행 빠르게 가실 분 환영.",
    ago: "1시간 전",
  },
  {
    id: "p3", courseId: "bearcreek", hostId: "h2", day: 1, tee: "07:12", holes: 18,
    total: 4, joiners: ["h2", "h8", "h6"], normal: 283000, price: 175000,
    reason: "일행 부상 취소", instant: false, level: "누구나",
    tags: ["여성 환영", "분위기 좋음", "조식 포함"], genderPref: "여성 우대",
    memo: "여성 3인 라운드에 한 분 모십니다. 새벽 티오프 후 클럽하우스 조식까지! 편한 분위기 원하시는 분.",
    ago: "2시간 전",
  },
  {
    id: "p4", courseId: "asiad", hostId: "h3", day: 0, tee: "18:02", holes: 9,
    total: 4, joiners: ["h3", "h1"], normal: 125000, price: 69000,
    reason: "동반자 야근 이슈", instant: true, level: "누구나",
    tags: ["야간 라운드", "퇴근 후", "노캐디"], genderPref: "무관",
    memo: "퇴근하고 바로 오시면 됩니다. 야간 9홀, 조명 켜진 코스가 진짜 예뻐요. 노캐디 셀프라 더 저렴합니다.",
    ago: "45분 전",
  },
  {
    id: "p5", courseId: "wellington", hostId: "h5", day: 2, tee: "08:36", holes: 18,
    total: 4, joiners: ["h5", "h1", "h7"], normal: 405000, price: 279000,
    reason: "회원 동반 1명 취소", instant: false, level: "90타 이내",
    tags: ["명문 코스", "회원 동반", "드레스코드"], genderPref: "무관",
    memo: "웰링턴 회원 동반 라운드입니다. 평소 못 가보는 코스, 이 기회에 경험해보세요. 드레스코드 지켜주실 분.",
    ago: "3시간 전",
  },
  {
    id: "p6", courseId: "seolhaeone", hostId: "h4", day: 1, tee: "11:48", holes: 18,
    total: 4, joiners: ["h4", "h6"], normal: 315000, price: 199000,
    reason: "커플 동반 취소", instant: true, level: "누구나",
    tags: ["오션뷰", "온천 포함", "1박 가능"], genderPref: "무관",
    memo: "양양 설해원, 라운드 후 온천까지 포함된 가격! 두 자리 비어서 급하게 올립니다. 서핑 겸 오시는 분도 환영.",
    ago: "20분 전",
  },
  {
    id: "p7", courseId: "southcape", hostId: "h5", day: 3, tee: "09:14", holes: 18,
    total: 4, joiners: ["h5", "h3", "h1"], normal: 475000, price: 329000,
    reason: "지인 해외출장 취소", instant: false, level: "90타 이내",
    tags: ["버킷리스트", "세계 100대 코스", "숙소 공유"], genderPref: "무관",
    memo: "사우스케이프 예약 성공했는데 한 명이 빠졌습니다. 인생 코스 같이 가실 진지한 골퍼 한 분!",
    ago: "5시간 전",
  },
  {
    id: "p8", courseId: "pinx", hostId: "h8", day: 2, tee: "10:22", holes: 18,
    total: 4, joiners: ["h8", "h2", "h4"], normal: 340000, price: 225000,
    reason: "제주 여행 일행 변경", instant: true, level: "누구나",
    tags: ["제주 원정", "여성 환영", "한라산 뷰"], genderPref: "여성 우대",
    memo: "제주 여행 중 라운드입니다. 핀크스 티타임 아깝게 날릴 수 없어요. 렌터카 픽업 가능!",
    ago: "1시간 전",
  },
  {
    id: "p9", courseId: "goldenbay", hostId: "h1", day: 1, tee: "14:30", holes: 18,
    total: 4, joiners: ["h1", "h5", "h7"], normal: 315000, price: 205000,
    reason: "동반자 경조사", instant: true, level: "누구나",
    tags: ["노을 라운드", "오션뷰", "사진 맛집"], genderPref: "무관",
    memo: "골든베이 노을 라운드. 후반 9홀에 해 지는 거 보면서 치는 코스입니다. 사진 좋아하시는 분 강추.",
    ago: "4시간 전",
  },
  {
    id: "p10", courseId: "bluoneship", hostId: "h6", day: 0, tee: "16:55", holes: 18,
    total: 4, joiners: ["h6", "h4"], normal: 179000, price: 95000,
    reason: "친구 2명 갑자기 취소", instant: true, level: "누구나",
    tags: ["초보환영", "노캐디", "머리올리기"], genderPref: "무관",
    memo: "초보 라운드예요! 저희도 잘 못 칩니다. 부담 없이 연습 겸 오실 분 두 분 구해요. 노캐디 셀프.",
    ago: "15분 전",
  },
  {
    id: "p11", courseId: "mooan", hostId: "h7", day: 3, tee: "07:58", holes: 36,
    total: 4, joiners: ["h7", "h3", "h5"], normal: 335000, price: 219000,
    reason: "원정 멤버 이탈", instant: false, level: "100타 이내",
    tags: ["36홀 올데이", "호남 원정", "골프텔 1박"], genderPref: "무관",
    memo: "무안 1박 2일 36홀 풀코스 원정. 골프텔 숙박 포함 가격입니다. 체력 되시는 분만!",
    ago: "6시간 전",
  },
  {
    id: "p12", courseId: "ora", hostId: "h2", day: 4, tee: "12:40", holes: 18,
    total: 4, joiners: ["h2", "h6"], normal: 239000, price: 149000,
    reason: "항공편 변경으로 2명 취소", instant: true, level: "누구나",
    tags: ["제주 원정", "공항 15분", "초보환영"], genderPref: "무관",
    memo: "제주 도착날 오후 라운드. 공항에서 15분이라 캐리어 들고 바로 오셔도 돼요. 두 자리!",
    ago: "2시간 전",
  },

  /* ── 스크린골프 모집 ── */
  {
    id: "p13", courseId: "sc-gangnam", hostId: "h7", day: 0, tee: "20:30", holes: 18, hours: 2,
    total: 4, joiners: ["h7", "h4"], normal: 33000, price: 12000,
    reason: "회식 불참 2명", instant: true, level: "누구나",
    tags: ["퇴근 후", "초보환영", "24시간"], genderPref: "무관",
    memo: "회사 동료 둘이 회식 때문에 빠졌어요. 룸은 이미 결제했으니 부담 없이 오세요. 실력 무관, 즐겁게 치실 분!",
    ago: "18분 전",
  },
  {
    id: "p14", courseId: "sc-seomyeon", hostId: "h3", day: 0, tee: "21:40", holes: 18, hours: 2,
    total: 4, joiners: ["h3", "h6"], normal: 30000, price: 13000,
    reason: "동반자 야근 이슈", instant: true, level: "누구나",
    tags: ["퇴근 후", "24시간", "야간 게임"], genderPref: "무관",
    memo: "서면에서 밤 게임 하실 분 두 분! 비 예보 때문에 필드 대신 잡은 룸입니다. 끝나고 국밥 옵션 있습니다.",
    ago: "25분 전",
  },
  {
    id: "p15", courseId: "sc-pangyo", hostId: "h5", day: 1, tee: "19:30", holes: 18, hours: 2,
    total: 4, joiners: ["h5", "h7", "h2"], normal: 21000, price: 15000,
    reason: "멤버 1명 출장 취소", instant: false, level: "100타 이내",
    tags: ["스킨스 게임", "퇴근 후", "판교"], genderPref: "무관",
    memo: "판교 퇴근 후 스킨스 한 게임. 소액 내기라 부담 없고, 100타 이내면 재밌게 치실 수 있어요.",
    ago: "1시간 전",
  },
  {
    id: "p16", courseId: "sc-hongdae", hostId: "h6", day: 0, tee: "23:50", holes: 18, hours: 2,
    total: 4, joiners: ["h6", "h4"], normal: 30000, price: 9900,
    reason: "친구 2명 갑자기 취소", instant: true, level: "누구나",
    tags: ["심야 게임", "초보환영"], genderPref: "무관",
    memo: "홍대 심야 게임! 저희 둘 다 백돌이라 진짜 편하게 오시면 됩니다. 끝나고 해장까지 가능하신 분 환영.",
    ago: "10분 전",
  },
];

/* 골프 크루 — icon: Phosphor 아이콘 클래스 */
const CREWS = [
  {
    id: "c1", name: "새벽티오프클럽", icon: "ph-sun-horizon", region: "수도권", members: 428,
    cover: "linear-gradient(135deg,#0B3B27,#1A6B44)",
    desc: "주말 첫 티오프만 노리는 새벽형 골퍼 모임. 5시 집결, 9시 해산, 오후는 가족에게.",
    schedule: "매주 토·일 새벽", tags: ["새벽 라운드", "수도권", "빠른 진행"],
    feed: [
      { name: "박성진", avatar: 3, g: 0, text: "이번 주 토요일 베어크리크 6:48 티오프 두 자리 남았습니다. 크루 우선!", when: "1시간 전", likes: 12 },
      { name: "김민재", avatar: 6, g: 1, text: "오늘 새벽 클럽72 안개 미쳤네요. 3번홀 사진 공유합니다.", when: "5시간 전", likes: 34 },
      { name: "정우성", avatar: 4, g: 4, text: "새벽 라운드 후 해장 국밥집 리스트 업데이트했습니다. 공지 확인!", when: "어제", likes: 56 },
    ],
  },
  {
    id: "c2", name: "여성골퍼연합 W", icon: "ph-flower", region: "수도권", members: 356,
    cover: "linear-gradient(135deg,#D6336C,#F783AC)",
    desc: "여성 골퍼끼리 편하게. 눈치 없는 라운드, 실력 무관, 매너만 필수.",
    schedule: "격주 토요일", tags: ["여성 전용", "초보 환영", "친목"],
    feed: [
      { name: "오하늘", avatar: 0, g: 2, text: "다음 정모는 레이크사이드입니다! 신입 두 분 환영해주세요.", when: "3시간 전", likes: 28 },
      { name: "김지연", avatar: 1, g: 3, text: "겨울 라운드용 이너 추천 부탁드려요. 손 시려서 그립이 안 잡혀요.", when: "어제", likes: 19 },
    ],
  },
  {
    id: "c3", name: "백돌이 탈출 스쿨", icon: "ph-graduation-cap", region: "전체", members: 812,
    cover: "linear-gradient(135deg,#F08C00,#FFD43B)",
    desc: "100타 깨기가 목표인 사람들의 모임. 스코어 인증하고 서로 원포인트.",
    schedule: "매주 온라인 + 월 1회 필드", tags: ["초보", "스코어 인증", "레슨 공유"],
    feed: [
      { name: "이수현", avatar: 2, g: 5, text: "드디어 99타!!! 2년 만에 백돌이 탈출했습니다. 다들 감사해요.", when: "2시간 전", likes: 87 },
      { name: "한서윤", avatar: 9, g: 2, text: "어프로치 뒤땅 교정 영상 올렸어요. 저처럼 고생하시는 분들 참고!", when: "어제", likes: 41 },
    ],
  },
  {
    id: "c4", name: "부산 나이트골프", icon: "ph-moon-stars", region: "영남", members: 271,
    cover: "linear-gradient(135deg,#1971C2,#15AABF)",
    desc: "퇴근 후 야간 9홀. 부산, 기장, 양산 야간 라운드 정보와 번개 라운드.",
    schedule: "평일 저녁 수시", tags: ["야간 라운드", "퇴근 후", "부산"],
    feed: [
      { name: "최동혁", avatar: 11, g: 1, text: "오늘 아시아드 야간 두 자리 비었습니다. 18:02 티오프, 모집 게시글 확인!", when: "40분 전", likes: 9 },
    ],
  },
  {
    id: "c5", name: "제주 원정대", icon: "ph-airplane-takeoff", region: "제주", members: 534,
    cover: "linear-gradient(135deg,#0CA678,#63E6BE)",
    desc: "제주 골프 여행 정보 총집합. 항공, 숙소, 티타임 꿀조합 공유와 원정 라운드 매칭.",
    schedule: "상시", tags: ["제주", "골프 여행", "원정 라운드"],
    feed: [
      { name: "오하늘", avatar: 0, g: 2, text: "12월 핀크스 3박4일 원정 짰습니다. 일정표 공유하니 벤치마킹 하세요!", when: "4시간 전", likes: 45 },
      { name: "김지연", avatar: 1, g: 3, text: "비행기 결항 대비 티타임 취소 규정 정리글 올렸어요. 필독!", when: "2일 전", likes: 62 },
    ],
  },
  {
    id: "c7", name: "퇴근길 스크린 클럽", icon: "ph-monitor-play", region: "전체", members: 645,
    cover: "linear-gradient(135deg,#1E3A8A,#3B82F6)",
    desc: "평일 저녁 스크린골프 번개 모임. 룸비는 무조건 1/N, 실력 무관, 내기는 음료수까지만.",
    schedule: "평일 저녁 상시", tags: ["스크린골프", "퇴근 후", "번개"],
    feed: [
      { name: "김민재", avatar: 6, g: 1, text: "오늘 강남역점 20:30 두 자리 비었습니다. 모집 게시글에서 바로 참여 가능!", when: "20분 전", likes: 14 },
      { name: "이수현", avatar: 2, g: 5, text: "어제 홍대점에서 처음으로 더블파 없이 완주했어요. 스크린 최고 기록!", when: "어제", likes: 31 },
    ],
  },
  {
    id: "c6", name: "싱글로 가는 길", icon: "ph-trophy", region: "전체", members: 198,
    cover: "linear-gradient(135deg,#5F3DC4,#845EF7)",
    desc: "80대 초반부터 싱글 지향 상급자 모임. 진지한 라운드, 대회 준비, 스킨스 게임.",
    schedule: "월 2회 필드", tags: ["상급자", "스킨스", "대회"],
    feed: [
      { name: "정우성", avatar: 4, g: 4, text: "이번 달 스킨스는 웰링턴에서. 참가비 공지 확인하세요.", when: "6시간 전", likes: 15 },
    ],
  },
];

/* 알림 — icon: Phosphor 클래스 */
const NOTIFS = [
  { icon: "ph-timer", title: "오늘 마감 임박!", body: "클럽72 GC 오후 티오프, 1자리가 48% 할인 중이에요.", when: "10분 전" },
  { icon: "ph-megaphone", title: "새 모집이 올라왔어요", body: "블루원 상주 · 초보환영 · 95,000원. 회원님 평균 타수와 잘 맞아요.", when: "1시간 전" },
  { icon: "ph-users-three", title: "여성골퍼연합 W 새 글", body: "다음 정모는 레이크사이드입니다! 신입 두 분 환영해주세요.", when: "3시간 전" },
  { icon: "ph-heart", title: "그린지수가 올랐어요", body: "최근 라운드 후기 5점을 받아 그린지수가 4.5에서 4.6이 됐어요.", when: "어제" },
];

/* DM 자동 응답 풀 (호스트 데모) */
const DM_REPLIES = [
  "안녕하세요! 라스트티 보고 연락 주셨군요. 어떤 점이 궁금하세요?",
  "네, 아직 자리 있습니다! 프로필 봤는데 잘 맞으실 것 같아요.",
  "티오프 30분 전까지만 클럽하우스로 와주시면 됩니다.",
  "복장은 일반 라운드 복장이면 충분해요. 부담 갖지 마세요.",
  "네네, 참여 신청 눌러주시면 바로 확정해드릴게요!",
  "정산은 라운드 끝나고 제가 정리해서 보내드립니다. 계좌이체로 받아요.",
  "좋습니다! 그럼 그날 뵐게요. 궁금한 거 있으면 언제든 물어보세요.",
];
const DM_CHIPS = ["아직 자리 있나요?", "초보인데 괜찮을까요?", "몇 분 전까지 가면 되나요?", "정산은 어떻게 하나요?"];

/* 은행 목록 (계좌이체 결제 수단) */
const BANKS = ["KB국민", "신한", "우리", "하나", "NH농협", "IBK기업", "카카오뱅크", "토스뱅크", "케이뱅크", "새마을금고"];

/* 자주 묻는 질문 */
const FAQS = [
  { q: "왜 이렇게 저렴한가요?", a: "골프장은 4인 예약이 원칙이라 한 명이 빠지면 남은 일행이 위약금이나 미달 그린피를 떠안습니다. 호스트는 그 손해 대신 빈자리를 할인가로 양도하는 것이라 서로에게 이득입니다." },
  { q: "스크린골프도 참여할 수 있나요?", a: "네! 스크린골프는 룸 단위로 결제하기 때문에 한 명이 빠지면 남은 사람들의 1인 부담이 확 올라갑니다. 빈자리를 채우면 룸비가 다시 1/N이 되니 필드보다도 할인 폭이 큰 경우가 많아요. 홈과 지도에서 스크린 필터로 모아볼 수 있습니다." },
  { q: "결제는 어떻게 하나요?", a: "현장결제 또는 계좌이체 중 선택할 수 있어요. 계좌이체를 선택하면 호스트 확정 후 채팅으로 정산 계좌가 안내됩니다. 그린피는 골프장에서 각자 결제하고, 캐디피와 카트비는 1/N 정산합니다." },
  { q: "혼자 가도 어색하지 않을까요?", a: "참여 전에 호스트와 동반자의 그린지수, 구력, 평균 타수, 후기를 모두 확인할 수 있어요. 채팅으로 미리 인사를 나누는 분들이 많습니다." },
  { q: "취소하면 위약금이 있나요?", a: "티오프 24시간 전까지는 무료 취소입니다. 이후 취소는 참여가의 50%가 위약금으로 부과되고, 노쇼는 그린지수가 크게 깎이며 3회 누적 시 이용이 제한됩니다." },
  { q: "그린지수가 뭔가요?", a: "라운드가 끝나면 동반자끼리 서로 남기는 매너 평가 점수입니다. 시간 약속, 페이스, 매너를 5점 만점으로 평가하며 프로필에 공개됩니다." },
  { q: "골프장과 제휴하려면 어떻게 하나요?", a: "설정의 골프장 제휴 문의로 연락 주시면 담당자가 안내해드립니다. 취소로 비는 티타임을 직접 올려 노쇼 손실을 매출로 바꿀 수 있습니다." },
];

/* 공지사항 */
const NOTICES = [
  { title: "라스트티 v1.2: 스크린골프 오픈", body: "골프존파크와 프렌즈 스크린 매장의 빈자리 참여가 열렸습니다. 룸비 1/N 정산으로 필드보다 큰 할인 폭을 만나보세요.", when: "오늘" },
  { title: "라스트티 v1.1 업데이트 안내", body: "실제 골프장 위성 전경, 상세 지도, 메시지 기능, 계좌이체 결제 수단이 추가됐습니다.", when: "어제" },
  { title: "여름 시즌 새벽 티오프 모집 증가", body: "무더위로 새벽 및 야간 라운드 모집이 크게 늘고 있어요. 알림을 켜두면 마감 임박 자리를 놓치지 않아요.", when: "3일 전" },
];

const TERMS_TEXT = "라스트티는 골퍼 간 라운드 참여를 연결하는 플랫폼으로, 골프장 이용 계약의 당사자가 아닙니다. 이용자는 만 19세 이상이어야 하며, 모집 글의 내용과 정산에 대한 책임은 호스트와 참여자에게 있습니다. 티오프 24시간 전까지 무료 취소가 가능하며, 이후 취소와 노쇼에는 위약금 및 이용 제한이 적용될 수 있습니다. 타인 사칭, 허위 모집, 매너 위반 시 서비스 이용이 제한됩니다.";
const PRIVACY_TEXT = "라스트티는 서비스 제공에 필요한 최소한의 정보(닉네임, 프로필, 활동 기록)만을 기기 내에 저장합니다. 본인인증 정보는 인증 기관에서 처리되며 앱에 저장되지 않습니다. 결제 수단 정보는 이용자의 기기에만 보관되고 서버로 전송되지 않습니다. 이용자는 언제든 설정에서 데이터를 초기화할 수 있습니다.";
