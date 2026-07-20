/* ══════════ LASTTEE seed data ══════════ */

// 한국 지도 도트 그리드 (스타일라이즈드) — '#'=본토, 'j'=제주
const KOREA_GRID = [
  "..............######",
  "....####..#########.",
  "...#################",
  "..#################.",
  "..#################.",
  "..################..",
  ".################...",
  ".###############....",
  "..##############....",
  "..###############...",
  ".#################..",
  ".##################.",
  ".##################.",
  "..#################.",
  "..################..",
  ".###############....",
  ".###############....",
  "..##############....",
  "..###########.##....",
  "...#########..##....",
  "....##..####........",
  "....................",
  "......jjj...........",
  ".....jjjjj..........",
  "......jjj...........",
];

const MAP_LABELS = [
  { t: "수도권", x: 24, y: 13 },
  { t: "강원", x: 66, y: 13 },
  { t: "충청", x: 34, y: 40 },
  { t: "영남", x: 66, y: 52 },
  { t: "호남", x: 26, y: 66 },
  { t: "제주", x: 47, y: 92 },
];

const REGIONS = ["전체", "수도권", "강원", "충청", "호남", "영남", "제주"];

// 골프장 (gx/gy = 지도 % 좌표, hue = 코스 아트 톤)
const COURSES = [
  {
    id: "sky72", name: "스카이72 GC", eng: "SKY72 Golf Club", region: "수도권", city: "인천 중구",
    type: "퍼블릭", holes: 72, par: 72, len: "6,932m", rating: 4.6, ratingN: 1284,
    green: { wd: 189000, we: 239000 }, caddy: 160000, cart: 100000,
    gx: 14, gy: 20, hue: 145, partner: true,
    tags: ["국내 최대 규모", "야간 라운드", "오션 코스"],
    facilities: ["클럽하우스", "드라이빙레인지", "사우나", "레스토랑", "프로샵", "연습그린"],
    desc: "인천공항 옆 국내 최대 퍼블릭. 하늘·바다·클래식·레이크 4개 코스 72홀, 시원한 바다 조망과 야간 라운드까지 가능한 수도권 대표 골프장.",
  },
  {
    id: "bearcreek", name: "베어크리크 GC", eng: "Bear Creek Golf Club", region: "수도권", city: "경기 포천",
    type: "퍼블릭", holes: 36, par: 72, len: "6,911m", rating: 4.7, ratingN: 876,
    green: { wd: 175000, we: 225000 }, caddy: 150000, cart: 100000,
    gx: 34, gy: 8, hue: 130, partner: true,
    tags: ["명문 퍼블릭", "산악 코스", "코스 관리 최상"],
    facilities: ["클럽하우스", "골프텔", "사우나", "레스토랑", "프로샵"],
    desc: "포천의 명문 퍼블릭 36홀. 크리크·베어 두 코스 모두 페어웨이 관리가 좋기로 유명하고, 가을 단풍 라운드는 수도권 최고로 꼽힌다.",
  },
  {
    id: "lakeside", name: "레이크사이드 CC", eng: "Lakeside Country Club", region: "수도권", city: "경기 용인",
    type: "회원제", holes: 54, par: 72, len: "6,703m", rating: 4.5, ratingN: 933,
    green: { wd: 210000, we: 265000 }, caddy: 160000, cart: 100000,
    gx: 30, gy: 24, hue: 155,
    tags: ["서울 30분", "54홀", "호수 전망"],
    facilities: ["클럽하우스", "사우나", "레스토랑", "연습그린", "프로샵"],
    desc: "서울에서 가장 가까운 대형 골프장 중 하나. 동·서·남 3개 코스 54홀, 호수를 낀 남코스 마지막 3홀이 시그니처.",
  },
  {
    id: "wellington", name: "웰링턴 CC", eng: "Wellington Country Club", region: "수도권", city: "경기 이천",
    type: "회원제", holes: 27, par: 72, len: "7,258m", rating: 4.9, ratingN: 412,
    green: { wd: 260000, we: 320000 }, caddy: 170000, cart: 110000,
    gx: 40, gy: 26, hue: 140,
    tags: ["프리미엄", "챔피언십 코스", "코스 레이팅 최상급"],
    facilities: ["클럽하우스", "사우나", "파인다이닝", "프로샵", "연습장"],
    desc: "이천의 하이엔드 코스. 와이번·그리핀·피닉스 27홀, 대회가 열리는 챔피언십 세팅과 압도적인 클럽하우스로 유명.",
  },
  {
    id: "oakvalley", name: "오크밸리 GC", eng: "Oak Valley Golf Club", region: "강원", city: "강원 원주",
    type: "회원제", holes: 36, par: 72, len: "6,801m", rating: 4.4, ratingN: 758,
    green: { wd: 165000, we: 215000 }, caddy: 150000, cart: 100000,
    gx: 56, gy: 22, hue: 135, partner: true,
    tags: ["리조트 병설", "산악 뷰", "골프텔"],
    facilities: ["리조트", "골프텔", "사우나", "레스토랑", "스키장"],
    desc: "원주 오크밸리 리조트 안의 36홀. 산 능선을 따라 도는 레이아웃으로 여름에도 시원하고, 리조트 숙박 패키지 조합이 좋다.",
  },
  {
    id: "seolhaeone", name: "설해원 GC", eng: "Seolhaeone", region: "강원", city: "강원 양양",
    type: "퍼블릭", holes: 27, par: 72, len: "6,858m", rating: 4.8, ratingN: 351,
    green: { wd: 195000, we: 250000 }, caddy: 160000, cart: 100000,
    gx: 74, gy: 7, hue: 160,
    tags: ["동해 오션뷰", "온천", "리조트"],
    facilities: ["리조트", "온천", "레스토랑", "프로샵", "연습그린"],
    desc: "양양 바닷가의 리조트형 27홀. 동해가 보이는 홀들과 라운드 후 온천이 시그니처. 서핑 성지 양양이라 여름 조인이 특히 활발.",
  },
  {
    id: "goldenbay", name: "골든베이 GC", eng: "Golden Bay Golf Club", region: "충청", city: "충남 태안",
    type: "회원제", holes: 27, par: 72, len: "7,012m", rating: 4.7, ratingN: 289,
    green: { wd: 180000, we: 235000 }, caddy: 160000, cart: 100000,
    gx: 14, gy: 40, hue: 150, partner: true,
    tags: ["서해 오션뷰", "시사이드 코스", "노을 명소"],
    facilities: ["클럽하우스", "골프텔", "사우나", "레스토랑"],
    desc: "태안 바닷가에 붙은 시사이드 코스. 서해로 티샷하는 오션 홀과 노을 라운드가 유명해 '한국의 페블비치'로 불린다.",
  },
  {
    id: "silkriver", name: "실크리버 CC", eng: "Silk River Country Club", region: "충청", city: "충북 청주",
    type: "퍼블릭", holes: 27, par: 72, len: "6,655m", rating: 4.3, ratingN: 512,
    green: { wd: 145000, we: 189000 }, caddy: 150000, cart: 90000,
    gx: 40, gy: 42, hue: 125,
    tags: ["가성비", "강변 코스", "평지형"],
    facilities: ["클럽하우스", "사우나", "레스토랑", "프로샵"],
    desc: "미호강을 낀 평지형 27홀. 걷기 편한 레이아웃과 합리적인 그린피로 중부권 주중 라운드 수요가 많다.",
  },
  {
    id: "bluoneship", name: "블루원 상주 GC", eng: "Bluone Sangju", region: "영남", city: "경북 상주",
    type: "퍼블릭", holes: 18, par: 72, len: "6,473m", rating: 4.2, ratingN: 405,
    green: { wd: 129000, we: 169000 }, caddy: 140000, cart: 90000,
    gx: 60, gy: 46, hue: 120,
    tags: ["가성비", "노캐디 선택", "초보 친화"],
    facilities: ["클럽하우스", "레스토랑", "프로샵"],
    desc: "노캐디 셀프 라운드를 선택할 수 있는 실속형 18홀. 부담 없는 그린피 덕에 머리 올리기 코스로도 인기.",
  },
  {
    id: "southcape", name: "사우스케이프", eng: "South Cape Owners Club", region: "영남", city: "경남 남해",
    type: "회원제", holes: 18, par: 72, len: "6,547m", rating: 4.9, ratingN: 502,
    green: { wd: 290000, we: 360000 }, caddy: 170000, cart: 110000,
    gx: 62, gy: 74, hue: 165,
    tags: ["세계 100대 코스", "절벽 오션 홀", "버킷리스트"],
    facilities: ["클럽하우스", "호텔", "파인다이닝", "스파", "프로샵"],
    desc: "남해 절벽 위, 세계 100대 코스에 꼽히는 대한민국 대표 오션 코스. 16번 파3는 한국 골퍼의 버킷리스트 그 자체.",
  },
  {
    id: "asiad", name: "아시아드 CC", eng: "Asiad Country Club", region: "영남", city: "부산 기장",
    type: "회원제", holes: 27, par: 72, len: "6,689m", rating: 4.4, ratingN: 618,
    green: { wd: 170000, we: 220000 }, caddy: 155000, cart: 100000,
    gx: 74, gy: 62, hue: 138,
    tags: ["부산 근교", "야간 라운드", "접근성"],
    facilities: ["클럽하우스", "사우나", "레스토랑", "연습장"],
    desc: "부산 도심에서 30분, 기장의 27홀. 야간 라운드 시설이 좋아 퇴근 후 9홀 조인 수요가 꾸준하다.",
  },
  {
    id: "mooan", name: "무안 CC", eng: "Muan Country Club", region: "호남", city: "전남 무안",
    type: "퍼블릭", holes: 36, par: 72, len: "6,712m", rating: 4.1, ratingN: 377,
    green: { wd: 119000, we: 159000 }, caddy: 140000, cart: 90000,
    gx: 22, gy: 66, hue: 128,
    tags: ["호남 가성비", "36홀", "무안공항 10분"],
    facilities: ["클럽하우스", "골프텔", "레스토랑"],
    desc: "호남 대표 실속 36홀. 겨울에도 잔디 상태가 좋아 시즌오프 원정 라운드로 유명하다.",
  },
  {
    id: "pinebeach", name: "파인비치 GL", eng: "Pine Beach Golf Links", region: "호남", city: "전남 해남",
    type: "회원제", holes: 18, par: 72, len: "6,395m", rating: 4.8, ratingN: 264,
    green: { wd: 210000, we: 270000 }, caddy: 160000, cart: 100000,
    gx: 26, gy: 78, hue: 158, partner: true,
    tags: ["정통 링크스", "리아스 해안", "오션 티샷"],
    facilities: ["클럽하우스", "리조트", "레스토랑", "프로샵"],
    desc: "해남 리아스식 해안을 그대로 살린 정통 링크스. 바다 건너로 티샷하는 파5가 시그니처, 바람이 라운드의 절반.",
  },
  {
    id: "pinx", name: "핀크스 GC", eng: "Pinx Golf Club", region: "제주", city: "제주 안덕",
    type: "회원제", holes: 27, par: 72, len: "6,812m", rating: 4.8, ratingN: 690,
    green: { wd: 200000, we: 255000 }, caddy: 160000, cart: 100000,
    gx: 38, gy: 91, hue: 148, partner: true,
    tags: ["세계 100대 코스", "한라산 뷰", "제주 명문"],
    facilities: ["클럽하우스", "포도호텔", "파인다이닝", "프로샵"],
    desc: "한라산과 산방산 사이, 제주 명문 27홀. 세계 100대 코스에 선정된 바 있고 안개 낀 아침 라운드가 압권.",
  },
  {
    id: "ora", name: "오라 CC", eng: "Ora Country Club", region: "제주", city: "제주시",
    type: "퍼블릭", holes: 36, par: 72, len: "6,602m", rating: 4.3, ratingN: 542,
    green: { wd: 139000, we: 185000 }, caddy: 150000, cart: 95000,
    gx: 56, gy: 88, hue: 132,
    tags: ["제주공항 15분", "한라산 뷰", "가성비"],
    facilities: ["클럽하우스", "사우나", "레스토랑"],
    desc: "제주공항에서 15분, 여행 일정에 끼워 넣기 가장 좋은 36홀. 바다와 한라산이 동시에 보이는 제주 입문 코스.",
  },
];

// 데모 유저 (호스트/조이너)
const HOSTS = [
  {
    id: "h1", name: "박성진", avatar: "🦅", g: 0, gender: "남", age: "40대", career: "구력 12년", avg: 84,
    rounds: 214, temp: 4.9, verified: true, badges: ["시간약속왕", "버디메이커", "조인 50회+"],
    intro: "주말 새벽 라운드 위주로 칩니다. 빠른 진행 좋아해요.",
    reviews: [
      { from: "김민재", stars: 5, text: "티오프 40분 전에 미리 와계셔서 여유있게 시작했어요. 진행도 빠르고 매너 최고.", when: "지난주" },
      { from: "이수현", stars: 5, text: "초보인 저를 배려해주시면서도 부담 안 주셔서 편했습니다.", when: "2주 전" },
      { from: "정우성", stars: 4, text: "실력도 매너도 좋으신 분. 다음에 또 조인하고 싶어요.", when: "지난달" },
    ],
  },
  {
    id: "h2", name: "김지연", avatar: "🐬", g: 3, gender: "여", age: "30대", career: "구력 5년", avg: 92,
    rounds: 87, temp: 4.8, verified: true, badges: ["매너 그린", "포섬 요정"],
    intro: "분위기 좋은 라운드 지향! 스코어보다 즐겁게 치는 게 좋아요.",
    reviews: [
      { from: "박성진", stars: 5, text: "라운드 내내 분위기 메이커셨어요. 덕분에 즐거웠습니다.", when: "지난주" },
      { from: "최동혁", stars: 5, text: "약속한 더치 정산 깔끔하게 해주셨어요.", when: "3주 전" },
    ],
  },
  {
    id: "h3", name: "최동혁", avatar: "🐯", g: 1, gender: "남", age: "30대", career: "구력 8년", avg: 88,
    rounds: 132, temp: 4.7, verified: true, badges: ["새벽 티오프", "조인 30회+"],
    intro: "기장/부산권 위주. 퇴근 후 야간 9홀도 자주 갑니다.",
    reviews: [
      { from: "김지연", stars: 5, text: "부산 로컬 맛집까지 알려주신 최고의 호스트.", when: "2주 전" },
      { from: "한서윤", stars: 4, text: "진행 템포가 좋아서 편하게 쳤습니다.", when: "지난달" },
    ],
  },
  {
    id: "h4", name: "한서윤", avatar: "🦊", g: 2, gender: "여", age: "20대", career: "구력 3년", avg: 98,
    rounds: 41, temp: 4.6, verified: true, badges: ["떠오르는 싱글", "매너 그린"],
    intro: "필드 경험 쌓는 중이에요. 초보 환영 라운드 좋아합니다!",
    reviews: [
      { from: "이수현", stars: 5, text: "같이 치면서 서로 응원해주는 분위기라 좋았어요.", when: "지난주" },
    ],
  },
  {
    id: "h5", name: "정우성", avatar: "🦁", g: 4, gender: "남", age: "50대", career: "구력 20년", avg: 79,
    rounds: 486, temp: 5.0, verified: true, badges: ["싱글 핸디", "조인 100회+", "시간약속왕"],
    intro: "20년차 싱글. 원포인트 부담 없이 물어보세요.",
    reviews: [
      { from: "박성진", stars: 5, text: "레전드. 스윙 봐주신 것만으로 그린피 값 했습니다.", when: "지난주" },
      { from: "김민재", stars: 5, text: "품격 있는 라운드가 뭔지 배웠습니다.", when: "지난달" },
    ],
  },
  {
    id: "h6", name: "이수현", avatar: "🐰", g: 5, gender: "여", age: "30대", career: "구력 2년", avg: 105,
    rounds: 18, temp: 4.5, verified: false, badges: ["새싹 골퍼"],
    intro: "머리 올린 지 2년! 즐겁게 배우면서 치고 있어요.",
    reviews: [
      { from: "한서윤", stars: 5, text: "긍정 에너지 만렙. 같이 치면 기분 좋아지는 분.", when: "2주 전" },
    ],
  },
  {
    id: "h7", name: "김민재", avatar: "🐻", g: 1, gender: "남", age: "40대", career: "구력 10년", avg: 86,
    rounds: 178, temp: 4.8, verified: true, badges: ["조인 50회+", "버디메이커"],
    intro: "수도권 평일 라운드 자주 엽니다. 캐디피 정산 칼같이.",
    reviews: [
      { from: "정우성", stars: 5, text: "정산이 제일 깔끔한 호스트.", when: "지난주" },
    ],
  },
  {
    id: "h8", name: "오하늘", avatar: "🦉", g: 2, gender: "여", age: "40대", career: "구력 9년", avg: 89,
    rounds: 149, temp: 4.9, verified: true, badges: ["여성 라운드 호스트", "매너 그린"],
    intro: "여성 골퍼 라운드를 주로 엽니다. 편안한 분위기 보장!",
    reviews: [
      { from: "김지연", stars: 5, text: "여성끼리 편하게 칠 수 있어서 너무 좋았어요.", when: "지난주" },
    ],
  },
];

// 조인 모집 (day = 오늘 기준 +n일)
const POSTINGS = [
  {
    id: "p1", courseId: "sky72", hostId: "h1", day: 0, tee: "13:24", holes: 18,
    total: 4, joiners: ["h1", "h7", "h4"], normal: 289000, price: 149000,
    reason: "동반자 1명 당일 취소", instant: true, level: "누구나",
    tags: ["초보환영", "캐디 포함", "카트 포함"], genderPref: "무관",
    memo: "일행이 급한 일로 못 오게 됐습니다. 위약금 내느니 같이 즐겁게 치실 분! 그린피+캐디피+카트비 다 포함한 가격이에요.",
    ago: "32분 전",
  },
  {
    id: "p2", courseId: "lakeside", hostId: "h7", day: 0, tee: "15:41", holes: 18,
    total: 4, joiners: ["h7", "h5"], normal: 335000, price: 189000,
    reason: "2명 노쇼 확정", instant: true, level: "100타 이내",
    tags: ["빠른진행", "캐디 포함"], genderPref: "무관",
    memo: "두 자리 비었습니다. 오후 티오프라 퇴근 전 반차 라운드로 딱이에요. 진행 빠르게 가실 분 환영.",
    ago: "1시간 전",
  },
  {
    id: "p3", courseId: "bearcreek", hostId: "h2", day: 1, tee: "07:12", holes: 18,
    total: 4, joiners: ["h2", "h8", "h6"], normal: 295000, price: 179000,
    reason: "일행 부상 취소", instant: false, level: "누구나",
    tags: ["여성 환영", "분위기 좋음", "조식 포함"], genderPref: "여성 우대",
    memo: "여성 3인 라운드에 한 분 모십니다. 새벽 티오프 후 클럽하우스 조식까지! 편한 분위기 원하시는 분.",
    ago: "2시간 전",
  },
  {
    id: "p4", courseId: "asiad", hostId: "h3", day: 0, tee: "18:02", holes: 9,
    total: 4, joiners: ["h3", "h1"], normal: 128000, price: 69000,
    reason: "동반자 야근 이슈", instant: true, level: "누구나",
    tags: ["야간 라운드", "퇴근 후", "노캐디"], genderPref: "무관",
    memo: "퇴근하고 바로 오시면 됩니다. 야간 9홀, 조명 켜진 코스가 진짜 예뻐요. 노캐디 셀프라 더 저렴.",
    ago: "45분 전",
  },
  {
    id: "p5", courseId: "wellington", hostId: "h5", day: 2, tee: "08:36", holes: 18,
    total: 4, joiners: ["h5", "h1", "h7"], normal: 445000, price: 299000,
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
    total: 4, joiners: ["h5", "h3", "h1"], normal: 545000, price: 379000,
    reason: "지인 해외출장 취소", instant: false, level: "90타 이내",
    tags: ["버킷리스트", "세계 100대 코스", "숙소 공유"], genderPref: "무관",
    memo: "사우스케이프 예약 성공했는데 한 명이 빠졌습니다. 인생 코스 같이 가실 진지한 골퍼 한 분!",
    ago: "5시간 전",
  },
  {
    id: "p8", courseId: "pinx", hostId: "h8", day: 2, tee: "10:22", holes: 18,
    total: 4, joiners: ["h8", "h2", "h4"], normal: 375000, price: 239000,
    reason: "제주 여행 일행 변경", instant: true, level: "누구나",
    tags: ["제주 원정", "여성 환영", "한라산 뷰"], genderPref: "여성 우대",
    memo: "제주 여행 중 라운드입니다. 핀크스 티타임 아깝게 날릴 수 없어요. 렌터카 픽업 가능!",
    ago: "1시간 전",
  },
  {
    id: "p9", courseId: "goldenbay", hostId: "h1", day: 1, tee: "14:30", holes: 18,
    total: 4, joiners: ["h1", "h5", "h7"], normal: 340000, price: 219000,
    reason: "동반자 경조사", instant: true, level: "누구나",
    tags: ["노을 라운드", "오션뷰", "사진 맛집"], genderPref: "무관",
    memo: "골든베이 노을 라운드. 후반 9홀에 해 지는 거 보면서 치는 코스입니다. 사진 좋아하시는 분 강추.",
    ago: "4시간 전",
  },
  {
    id: "p10", courseId: "bluoneship", hostId: "h6", day: 0, tee: "16:55", holes: 18,
    total: 4, joiners: ["h6", "h4"], normal: 189000, price: 99000,
    reason: "친구 2명 갑자기 취소", instant: true, level: "누구나",
    tags: ["초보환영", "노캐디", "머리올리기"], genderPref: "무관",
    memo: "초보 라운드예요! 저희도 잘 못 칩니다 ㅋㅋ 부담 없이 연습 겸 오실 분 두 분 구해요. 노캐디 셀프.",
    ago: "15분 전",
  },
  {
    id: "p11", courseId: "mooan", hostId: "h7", day: 3, tee: "07:58", holes: 36,
    total: 4, joiners: ["h7", "h3", "h5"], normal: 265000, price: 169000,
    reason: "원정 멤버 이탈", instant: false, level: "100타 이내",
    tags: ["36홀 올데이", "호남 원정", "골프텔 1박"], genderPref: "무관",
    memo: "무안 1박 2일 36홀 풀코스 원정. 골프텔 숙박 포함 가격입니다. 체력 되시는 분만!",
    ago: "6시간 전",
  },
  {
    id: "p12", courseId: "ora", hostId: "h2", day: 4, tee: "12:40", holes: 18,
    total: 4, joiners: ["h2", "h6"], normal: 245000, price: 155000,
    reason: "항공편 변경으로 2명 취소", instant: true, level: "누구나",
    tags: ["제주 원정", "공항 15분", "초보환영"], genderPref: "무관",
    memo: "제주 도착날 오후 라운드. 공항에서 15분이라 캐리어 들고 바로 오셔도 돼요. 두 자리!",
    ago: "2시간 전",
  },
];

// 골프 크루 (커뮤니티)
const CREWS = [
  {
    id: "c1", name: "새벽티오프클럽", emoji: "🌅", region: "수도권", members: 428,
    cover: "linear-gradient(135deg,#0B3B27,#1A6B44)",
    desc: "주말 첫 티오프만 노리는 새벽형 골퍼 모임. 5시 집결, 9시 해산, 오후는 가족에게.",
    schedule: "매주 토·일 새벽", tags: ["새벽 라운드", "수도권", "빠른 진행"],
    feed: [
      { name: "박성진", avatar: "🦅", g: 0, text: "이번 주 토요일 베어크리크 6:48 티오프 두 자리 남았습니다. 크루 우선!", when: "1시간 전", likes: 12 },
      { name: "김민재", avatar: "🐻", g: 1, text: "오늘 새벽 스카이72 안개 미쳤네요. 3번홀 사진 공유합니다 ⛳", when: "5시간 전", likes: 34 },
      { name: "정우성", avatar: "🦁", g: 4, text: "새벽 라운드 후 해장 국밥집 리스트 업데이트했습니다. 공지 확인!", when: "어제", likes: 56 },
    ],
  },
  {
    id: "c2", name: "여성골퍼연합 W", emoji: "🌸", region: "수도권", members: 356,
    cover: "linear-gradient(135deg,#D6336C,#F783AC)",
    desc: "여성 골퍼끼리 편하게. 눈치 없는 라운드, 실력 무관, 매너만 필수.",
    schedule: "격주 토요일", tags: ["여성 전용", "초보 환영", "친목"],
    feed: [
      { name: "오하늘", avatar: "🦉", g: 2, text: "다음 정모는 레이크사이드입니다! 신입 두 분 환영해주세요 👏", when: "3시간 전", likes: 28 },
      { name: "김지연", avatar: "🐬", g: 3, text: "겨울 라운드용 이너 추천 부탁드려요. 손 시려서 그립이 안 잡혀요 🥶", when: "어제", likes: 19 },
    ],
  },
  {
    id: "c3", name: "백돌이 탈출 스쿨", emoji: "🎓", region: "전체", members: 812,
    cover: "linear-gradient(135deg,#F08C00,#FFD43B)",
    desc: "100타 깨기가 목표인 사람들의 모임. 스코어 인증하고 서로 원포인트.",
    schedule: "매주 온라인 + 월 1회 필드", tags: ["초보", "스코어 인증", "레슨 공유"],
    feed: [
      { name: "이수현", avatar: "🐰", g: 5, text: "드디어 99타!!! 2년 만에 백돌이 탈출했습니다 🎉 다들 감사해요", when: "2시간 전", likes: 87 },
      { name: "한서윤", avatar: "🦊", g: 2, text: "어프로치 뒤땅 교정 영상 올렸어요. 저처럼 고생하시는 분들 참고!", when: "어제", likes: 41 },
    ],
  },
  {
    id: "c4", name: "부산 나이트골프", emoji: "🌃", region: "영남", members: 271,
    cover: "linear-gradient(135deg,#1971C2,#15AABF)",
    desc: "퇴근 후 야간 9홀. 부산·기장·양산 야간 라운드 정보와 번개 조인.",
    schedule: "평일 저녁 수시", tags: ["야간 라운드", "퇴근 후", "부산"],
    feed: [
      { name: "최동혁", avatar: "🐯", g: 1, text: "오늘 아시아드 야간 두 자리 비었습니다. 18:02 티오프, 조인 게시글 확인!", when: "40분 전", likes: 9 },
    ],
  },
  {
    id: "c5", name: "제주 원정대", emoji: "🍊", region: "제주", members: 534,
    cover: "linear-gradient(135deg,#0CA678,#63E6BE)",
    desc: "제주 골프 여행 정보 총집합. 항공+숙소+티타임 꿀조합 공유, 원정 조인 매칭.",
    schedule: "상시", tags: ["제주", "골프 여행", "원정 조인"],
    feed: [
      { name: "오하늘", avatar: "🦉", g: 2, text: "12월 핀크스 3박4일 원정 짰습니다. 일정표 공유하니 벤치마킹 하세요!", when: "4시간 전", likes: 45 },
      { name: "김지연", avatar: "🐬", g: 3, text: "비행기 결항 대비 티타임 취소 규정 정리글 올렸어요. 필독!", when: "2일 전", likes: 62 },
    ],
  },
  {
    id: "c6", name: "싱글로 가는 길", emoji: "🏆", region: "전체", members: 198,
    cover: "linear-gradient(135deg,#5F3DC4,#845EF7)",
    desc: "80대 초반~싱글 지향 상급자 모임. 진지한 라운드, 대회 준비, 스킨스 게임.",
    schedule: "월 2회 필드", tags: ["상급자", "스킨스", "대회"],
    feed: [
      { name: "정우성", avatar: "🦁", g: 4, text: "이번 달 스킨스는 웰링턴에서. 참가비 공지 확인하세요.", when: "6시간 전", likes: 15 },
    ],
  },
];

// 알림 시드
const NOTIFS = [
  { icon: "⛳", title: "오늘 마감 임박!", body: "스카이72 GC 13:24 티오프, 1자리가 48% 할인 중이에요.", when: "10분 전" },
  { icon: "🎉", title: "새 조인이 올라왔어요", body: "블루원 상주 · 초보환영 · ₩99,000 — 회원님 평균 타수와 잘 맞아요.", when: "1시간 전" },
  { icon: "🌸", title: "여성골퍼연합 W 새 글", body: "다음 정모는 레이크사이드입니다! 신입 두 분 환영해주세요.", when: "3시간 전" },
  { icon: "💚", title: "그린지수가 올랐어요", body: "최근 라운드 후기 5점을 받아 그린지수가 4.5 → 4.6이 됐어요.", when: "어제" },
];

const AVATARS = ["🦅", "🐯", "🦊", "🐬", "🦁", "🐰", "🐻", "🦉", "🐳", "🐴", "🦆", "🐢"];
const CAREERS = ["입문 (1년 미만)", "구력 1~3년", "구력 3~7년", "구력 7~15년", "구력 15년+"];
