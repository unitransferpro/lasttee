/* ══════════════════ LASTTEE app v2 ══════════════════ */
"use strict";

/* ── 유틸 ─────────────────────────────── */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const appEl = $("#app");
const won = n => "₩" + Math.round(n).toLocaleString("ko-KR");
const BOOT = new Date();
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const VERSION = "1.5.0";

/* 전국 디렉토리(venues.js) 항목 → 코스 객체 (dv{index} id) */
const DIRV = typeof DIR_VENUES !== "undefined" ? DIR_VENUES : [];
const dirCourse = i => {
  const v = DIRV[i];
  if (!v) return null;
  const scr = v.k === "s";
  const rng = v.k === "r";
  const city = v.a ? v.a.split(" ").slice(0, 2).join(" ") : (v.c || v.r);
  return {
    id: "dv" + i, dir: true, kind: scr ? "screen" : undefined, approx: !!v.x || !v.lat, rng,
    name: v.n, eng: "", region: v.r, city, addr: v.a || v.c || "",
    lat: v.lat, lng: v.lng, holes: v.h || 18, par: 72, len: "",
    rating: 0, ratingN: 0, green: null, caddy: 0, cart: 0, room: null,
    type: v.t || (scr ? "스크린" : rng ? "연습장" : "골프장"), rooms: 0, hoursOpen: "",
    brandShort: v.n.includes("골프존") ? "골프존" : v.n.includes("프렌즈") ? "카카오VX" : (v.n.includes("티업") || v.n.toUpperCase().includes("SG")) ? "SG골프" : "골프존",
    brand: "", game: 0, practice: 0, tags: v.t ? [v.t] : [], facilities: [], hue: scr ? 195 : rng ? 260 : 140,
    desc: `전국 디렉토리에 등록된 ${scr ? "스크린골프 매장" : rng ? "골프연습장" : v.t ? v.t + " 골프장" : "골프장"}입니다. 정확한 요금과 예약 정보는 네이버 지도에서 확인하세요.`,
  };
};
const courseById = id => (id && id.startsWith && id.startsWith("dv")) ? dirCourse(+id.slice(2)) : COURSES.find(c => c.id === id);
const hostById = id => HOSTS.find(h => h.id === id);
const isScreen = c => c && c.kind === "screen";
const geoOf = id => {
  if (typeof COURSE_GEO !== "undefined" && COURSE_GEO[id]) return COURSE_GEO[id];
  const c = courseById(id);
  if (c && c.lat) {
    return {
      lat: c.lat, lng: c.lng,
      mx: ((c.lng - GEO.minLng) / (GEO.maxLng - GEO.minLng)) * GEO.W,
      my: ((GEO.maxLat - c.lat) / (GEO.maxLat - GEO.minLat)) * GEO.H,
    };
  }
  return null;
};

/* ── 스토어 ────────────────────────────── */
const Store = {
  key: "lt_store_v1",
  data: {
    user: null, seenOb: false, joined: [], myPosts: [], crews: [], likes: [], crewFeed: {}, closed: [],
    chats: {}, readAt: {}, pay: null, payPref: "onsite", subJoined: [],
    set: { dark: false, nJoin: true, nHot: true, nCrew: true, nMkt: false },
  },
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) {
        const d = JSON.parse(raw);
        this.data = Object.assign(this.data, d);
        this.data.set = Object.assign({ dark: false, nJoin: true, nHot: true, nCrew: true, nMkt: false }, d.set || {});
      }
    } catch (e) {}
    // v1 → v2 마이그레이션: 이모지 아바타 → 글리프 인덱스
    const u = this.data.user;
    if (u && typeof u.avatar === "string") u.avatar = 2;
  },
  save() { localStorage.setItem(this.key, JSON.stringify(this.data)); },
};
Store.load();
const S = Store.data;

/* ── 다크 모드 ─────────────────────────── */
function applyTheme() {
  document.body.classList.toggle("dark", !!S.set.dark);
  const m = $('meta[name="theme-color"]');
  if (m) m.content = S.set.dark ? "#0E1712" : "#0B3B27";
}
applyTheme();

/* ── 티오프 시간 계산 ───────────────────── */
const DAY0_OFFSET_H = { p1: 2.4, p2: 4.9, p4: 6.3, p10: 3.2, p13: 1.6, p14: 5.5, p16: 7.2 };
function teeDate(p) {
  if (p.day === 0 && DAY0_OFFSET_H[p.id]) {
    return new Date(BOOT.getTime() + DAY0_OFFSET_H[p.id] * 3600e3);
  }
  const [h, m] = p.tee.split(":").map(Number);
  const d = new Date(BOOT.getFullYear(), BOOT.getMonth(), BOOT.getDate() + p.day, h, m);
  if (p.day === 0 && d < BOOT) d.setDate(d.getDate() + 1);
  return d;
}
function teeStr(p) {
  const d = teeDate(p);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}
function dayLabel(p) {
  const d = teeDate(p);
  const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(BOOT.getFullYear(), BOOT.getMonth(), BOOT.getDate())) / 864e5);
  const name = diff === 0 ? "오늘" : diff === 1 ? "내일" : diff === 2 ? "모레" : diff + "일 후";
  return `${name} ${d.getMonth() + 1}.${d.getDate()}(${DOW[d.getDay()]})`;
}

/* ── 모집 데이터 접근 ───────────────────── */
function allPosts() { return POSTINGS.concat(S.myPosts).filter(p => !S.closed.includes(p.id)); }
function postById(id) { return allPosts().find(p => p.id === id); }
function joinerIds(p) {
  const ids = [...p.joiners];
  if (S.joined.includes(p.id)) ids.push("me");
  return ids;
}
function slotsLeft(p) { return Math.max(0, p.total - joinerIds(p).length); }
function discount(p) { return Math.round((1 - p.price / p.normal) * 100); }
function openPosts() { return allPosts().filter(p => slotsLeft(p) > 0); }
function postsForCourse(cid) { return openPosts().filter(p => p.courseId === cid); }

function personOf(id) {
  if (id === "me" && S.user) return { id: "me", name: S.user.nick, avatar: S.user.avatar, g: S.user.g, career: S.user.career, avg: S.user.avg, temp: 5.0, rounds: S.joined.length, verified: S.user.verified };
  return hostById(id);
}

/* ── 아바타 (커스텀 SVG 글리프) ─────────────── */
function avat(pers, extra = "") {
  const i = (pers && pers.avatar) || 0;
  return `<div class="av g${(pers && pers.g) || 0} ${extra}"><svg viewBox="0 0 24 24">${AV_GLYPHS[i % AV_GLYPHS.length]}</svg></div>`;
}

/* ── 위성 사진 (Esri World Imagery, 실제 코스 전경) ── */
function tileXY(lat, lng, z) {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const la = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2) * n;
  return [x, y];
}
function satUrl(c, z) {
  const g = geoOf(c.id);
  if (!g) return "";
  const [x, y] = tileXY(g.lat, g.lng, z);
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${Math.floor(y)}/${Math.floor(x)}`;
}
function satShot(c, z, cap = "") {
  // 근사 좌표(주소 단위 지오코딩)는 위성 사진을 실제 전경으로 표시하지 않음
  const u = c.approx ? "" : satUrl(c, z);
  return `${courseArt(c, 0)}${u ? `<img loading="lazy" src="${u}" alt="${c.name} 위성 전경" onerror="this.remove()">` : ""}${u && cap ? `<span class="sat-tag">${cap}</span>` : ""}`;
}

/* ── 코스 일러스트 (위성 로드 전 폴백) ─────────── */
function seedRand(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822519); h = Math.imul(h ^ (h >>> 13), 3266489917); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
function courseArt(course, variant = 0) {
  const r = seedRand(course.id + variant);
  const hue = course.hue;
  const skies = [["#BDE8FF", "#E8F7FF"], ["#FFB88A", "#FFE3C2"], ["#D9C8F5", "#FDE7EF"]];
  const [s1, s2] = skies[variant % 3];
  const g = l => `hsl(${hue},46%,${l}%)`;
  let trees = "";
  for (let i = 0; i < 5; i++) trees += `<circle cx="${12 + r() * 176}" cy="${66 + r() * 14}" r="${5 + r() * 5}" fill="${g(24 + r() * 8)}"/>`;
  const bx = 46 + r() * 100, fx = 120 + r() * 50;
  return `<svg viewBox="0 0 200 130" preserveAspectRatio="xMidYMid slice">
    <rect width="200" height="130" fill="${s1}"/>
    <path d="M0 78 Q 50 ${58 + r() * 10} 100 74 T 200 70 V130 H0 Z" fill="${g(30)}"/>
    <path d="M0 92 Q 60 ${76 + r() * 8} 120 90 T 200 86 V130 H0 Z" fill="${g(38)}"/>
    <path d="M0 108 Q 70 ${94 + r() * 8} 140 106 T 200 102 V130 H0 Z" fill="${g(46)}"/>
    ${trees}
    <ellipse cx="${bx}" cy="116" rx="17" ry="5.5" fill="#EFE3B0"/>
    <ellipse cx="${fx}" cy="112" rx="26" ry="7" fill="${g(56)}"/>
    <line x1="${fx}" y1="112" x2="${fx}" y2="84" stroke="#F8F9FA" stroke-width="2"/>
    <path d="M${fx} 84 L${fx + 15} 89 L${fx} 94 Z" fill="#D6F94B" stroke="#083D28" stroke-width=".6"/>
  </svg>`;
}

/* ── 공통 UI ───────────────────────────── */
let toastTimer;
function toast(msg, icon = "check-circle") {
  const t = $("#toast");
  t.innerHTML = `<i class="ph-fill ph-${icon}"></i>${msg}`;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}
function openSheet(html) {
  const w = $("#sheet-wrap");
  $("#sheet").innerHTML = html;
  w.classList.remove("hidden");
  requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add("show")));
}
function closeSheet() {
  const w = $("#sheet-wrap");
  w.classList.remove("show");
  setTimeout(() => w.classList.add("hidden"), 380);
}
$("#sheet-dim").addEventListener("click", closeSheet);

function stagger(sel = ".in") {
  $$(sel).forEach((el, i) => { el.style.animationDelay = Math.min(i * 70, 560) + "ms"; });
}
function countUp(el, target, { prefix = "", suffix = "", dur = 900 } = {}) {
  const t0 = performance.now();
  const step = now => {
    const p = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = prefix + Math.round(target * e).toLocaleString("ko-KR") + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* 스크롤 리빌 */
const rvIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("vis"); rvIO.unobserve(e.target); } }), { threshold: 0.12 });
function bindRv() { $$(".rv").forEach(el => rvIO.observe(el)); }

/* 뷰포트 리사이즈 → 지도 재계산 */
let _rsT;
window.addEventListener("resize", () => {
  clearTimeout(_rsT);
  _rsT = setTimeout(() => {
    if ($("#big-map")) mountBigMap();
    if ($("#nb-map")) mountNearbyMap();
  }, 220);
});

/* 히어로 패럴랙스 */
window.addEventListener("scroll", () => {
  const hi = $(".hero-inner");
  if (hi) {
    const y = Math.min(window.scrollY, 400);
    hi.style.transform = `translateY(${y * 0.2}px)`;
    hi.style.opacity = 1 - y / 520;
  }
}, { passive: true });

/* 카운트다운 틱 */
setInterval(() => {
  $$("[data-cd]").forEach(el => {
    const left = +el.dataset.cd - Date.now();
    const timer = el.closest(".hot-timer");
    if (timer) timer.classList.toggle("urgent", left > 0 && left < 3600e3);
    if (left <= 0) { el.textContent = "티오프!"; return; }
    const h = Math.floor(left / 3600e3), m = Math.floor(left % 3600e3 / 60e3), s = Math.floor(left % 60e3 / 1e3);
    el.textContent = (h > 0 ? h + ":" : "") + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  });
}, 1000);

/* ── 채팅 데이터 ────────────────────────── */
const pendingReply = {};
function nowStr() {
  const d = new Date();
  const h = d.getHours();
  return `${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function chatMsgs(hid) { return S.chats[hid] || []; }
function unreadOf(hid) {
  const msgs = chatMsgs(hid);
  const seen = S.readAt[hid] || 0;
  return msgs.slice(seen).filter(m => m.f === "h").length;
}
function unreadTotal() { return Object.keys(S.chats).reduce((n, h) => n + unreadOf(h), 0); }
function pushMsg(hid, f, t) {
  if (!S.chats[hid]) S.chats[hid] = [];
  S.chats[hid].push({ f, t, w: nowStr() });
  Store.save();
}
function scheduleReply(hid, custom) {
  pendingReply[hid] = true;
  const delay = 1400 + Math.random() * 1400;
  setTimeout(() => {
    const hostMsgN = chatMsgs(hid).filter(m => m.f === "h").length;
    pushMsg(hid, "h", custom || DM_REPLIES[hostMsgN % DM_REPLIES.length]);
    pendingReply[hid] = false;
    if (location.hash === "#/chat/" + hid) renderThread(hid);
    else if (location.hash === "#/chat") renderChatList();
  }, delay);
  if (location.hash === "#/chat/" + hid) renderThread(hid);
}
window.openChat = hid => {
  if (!S.user) { toast("메시지를 보내려면 프로필이 필요해요", "user-circle-plus"); location.hash = "#/signup"; return; }
  if (!S.chats[hid]) {
    const h = hostById(hid);
    pushMsg(hid, "h", `안녕하세요, ${h.name}입니다. 궁금한 점 편하게 물어보세요!`);
  }
  location.hash = "#/chat/" + hid;
};

/* ── 네이버 지도 ────────────────────────── */
window.nmap = name => {
  window.open("https://map.naver.com/p/search/" + encodeURIComponent(name), "_blank");
};
function naverBtn(c) {
  return `<button class="naver-btn" onclick="nmap('${c.name.replace(/'/g, "")} ${c.city.split(" ")[0]}')"><span class="n-logo">N</span>네이버 지도에서 자세히 보기</button>`;
}

/* ── 카드 컴포넌트 ─────────────────────── */
function hotCard(p) {
  const c = courseById(p.courseId);
  const scr = isScreen(c);
  return `
  <div class="hot-card in" onclick="location.hash='#/post/${p.id}'">
    <div class="hot-art sat">${satShot(c, scr ? 17 : 15, scr ? "매장 인근 위성" : "실제 위성 전경")}
      <div class="hot-timer"><i class="ph-fill ph-timer"></i><span data-cd="${teeDate(p).getTime()}">00:00</span></div>
      <div class="hot-off">${discount(p)}%</div>
      ${scr ? '<div class="hot-kind"><i class="ph-fill ph-monitor-play"></i>스크린</div>' : ""}
    </div>
    <div class="hot-body">
      <div class="hot-course">${c.name}</div>
      <div class="hot-meta"><i class="ph-fill ph-map-pin"></i>${c.city} · ${dayLabel(p)} ${teeStr(p)} · ${scr ? p.holes + "홀 게임" : p.holes + "홀"}</div>
      <div class="hot-price"><del>${won(p.normal)}</del><b>${won(p.price)}<small> /1인</small></b></div>
    </div>
  </div>`;
}
function postCard(p) {
  const c = courseById(p.courseId);
  const scr = isScreen(c);
  const left = slotsLeft(p);
  const js = joinerIds(p).slice(0, 3).map(id => avat(personOf(id))).join("");
  const mine = p.hostId === "me";
  return `
  <div class="post-card in" onclick="location.hash='#/post/${p.id}'">
    ${mine ? '<div class="mine-flag">내 모집</div>' : ""}
    <div class="pc-art sat">${satShot(c, scr ? 17 : 14)}<div class="pc-off">${discount(p)}%</div></div>
    <div class="pc-main">
      <div class="pc-title">${c.name}</div>
      <div class="pc-meta">${dayLabel(p)} ${teeStr(p)} · ${scr ? p.holes + "홀 게임" : p.holes + "홀"} · ${c.city}</div>
      <div class="pc-row">
        <div class="pc-price"><del>${won(p.normal)}</del><b>${won(p.price)}<small>/1인</small></b></div>
        <div class="pc-slots"><div class="pc-avatars">${js}</div><span class="pc-need">${left}자리</span></div>
      </div>
      <div class="pc-badges">${scr ? '<span class="tag blue"><i class="ph-fill ph-monitor-play"></i>스크린</span>' : ""}${p.tags.slice(0, 2).map(t => `<span class="tag ${t.includes("초보") ? "lime" : ""}">${t}</span>`).join("")}${p.instant ? '<span class="tag green"><i class="ph-fill ph-lightning"></i>즉시확정</span>' : ""}</div>
    </div>
  </div>`;
}

/* ── 실제 한국 지도 ─────────────────────── */
function proj(lat, lng) {
  return [((lng - GEO.minLng) / (GEO.maxLng - GEO.minLng)) * 100, ((GEO.maxLat - lat) / (GEO.maxLat - GEO.minLat)) * 100];
}
const MAP_LABELS = [
  { t: "수도권", lat: 37.75, lng: 126.55 }, { t: "강원", lat: 37.6, lng: 128.35 },
  { t: "충청", lat: 36.45, lng: 126.85 }, { t: "호남", lat: 35.25, lng: 126.75 },
  { t: "영남", lat: 35.95, lng: 128.75 }, { t: "제주", lat: 33.6, lng: 126.9 },
];
function koreaMap(interactive = true, kind = "전체") {
  const paths = KOREA_PATHS.map(d => `<path class="map-prov" d="${d}"/>`).join("");
  const dots = KOREA_PATHS.map(d => `<path d="${d}" fill="url(#mdots)"/>`).join("");
  const labels = MAP_LABELS.map(l => {
    const [x, y] = proj(l.lat, l.lng);
    return `<div class="map-label" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%">${l.t}</div>`;
  }).join("");
  const shown = COURSES.filter(c => kind === "전체" || (kind === "스크린" ? isScreen(c) : !isScreen(c)));
  const pins = shown.map((c, i) => {
    const g = geoOf(c.id);
    if (!g) return "";
    const n = postsForCourse(c.id).length;
    const x = (g.mx / GEO.W) * 100, y = (g.my / GEO.H) * 100;
    const scr = isScreen(c);
    return `<button class="pin ${n ? "" : "dim"} ${scr ? "pin-scr" : ""}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%" ${interactive ? `onclick="event.stopPropagation();pinSheet('${c.id}')"` : ""}>
      <span class="pin-dot" style="animation-delay:${i * 60}ms"><i class="ph-fill ${scr ? "ph-monitor-play" : "ph-golf"}"></i></span>
      <span class="pin-n">${c.name.replace("골프존파크 ", "").replace("프렌즈 스크린 ", "").split(" ")[0]}${n ? " · " + n : ""}</span>
    </button>`;
  }).join("");
  // 전국 디렉토리 점 (필드: 라임, 스크린: 블루)
  const dirDots = DIRV.map((v, i) => {
    if (!v.lat) return "";
    if (kind === "스크린" && v.k !== "s") return "";
    if (kind === "필드" && v.k === "s") return "";
    const x = ((v.lng - GEO.minLng) / (GEO.maxLng - GEO.minLng)) * 100;
    const y = ((GEO.maxLat - v.lat) / (GEO.maxLat - GEO.minLat)) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return "";
    return `<button class="dir-dot ${v.k === "s" ? "scr" : ""}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%" ${interactive ? `onclick="event.stopPropagation();location.hash='#/course/dv${i}'"` : ""} aria-label="${v.n}"></button>`;
  }).join("");
  return `<div class="map-box">
    <svg viewBox="0 0 ${GEO.W} ${GEO.H}">
      <defs><pattern id="mdots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.4" cy="1.4" r=".95" fill="rgba(214,249,75,.13)"/></pattern></defs>
      ${paths}${dots}
    </svg>
    ${labels}${dirDots}${pins}
  </div>`;
}
window.pinSheet = cid => {
  const c = courseById(cid);
  const posts = postsForCourse(cid);
  openSheet(`
    <div style="display:flex;gap:13px;align-items:center;margin-bottom:16px">
      <div class="sat" style="width:64px;height:64px;border-radius:18px;flex:none">${satShot(c, 14)}</div>
      <div>
        <div style="font-size:17px;font-weight:900">${c.name}</div>
        <div style="font-size:12.5px;color:var(--ink-3);font-weight:600;margin-top:3px">${c.city}${isScreen(c) ? "" : " · " + c.holes + "홀"} · ${c.type}${c.rating ? " · " + c.rating + "점" : ""}</div>
      </div>
    </div>
    ${posts.length
      ? posts.map(p => `<div class="map-sheet-card" onclick="closeSheet();location.hash='#/post/${p.id}'">
          <div style="flex:1"><b style="font-size:14.5px">${dayLabel(p)} ${teeStr(p)} · ${p.holes}홀</b>
          <div style="font-size:12px;color:var(--ink-3);font-weight:600;margin-top:3px">${slotsLeft(p)}자리 남음 · ${p.reason}</div></div>
          <div style="text-align:right"><b style="font-size:16px;font-weight:900">${won(p.price)}</b>
          <div style="font-size:11px;color:var(--red);font-weight:800">${discount(p)}% 할인</div></div>
        </div>`).join("")
      : '<div class="empty" style="padding:26px"><b>지금은 모집이 없어요</b><p>이 골프장의 새 모집이 올라오면 알려드릴게요.</p></div>'}
    <button class="btn btn-ghost" style="margin-top:12px" onclick="closeSheet();location.hash='#/course/${c.id}'">골프장 상세 보기</button>
  `);
};

/* ══════════════════ 뷰 ══════════════════ */

/* ── 온보딩 ───────────────────────────── */
const OB_ARTS = [
  `<svg viewBox="0 0 160 130"><ellipse cx="80" cy="112" rx="62" ry="12" fill="#0F4530"/><ellipse cx="80" cy="108" rx="46" ry="9" fill="#1A6B44"/><line x1="72" y1="104" x2="72" y2="34" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M75 34 L118 46 L75 60 Z" fill="#D6F94B"/><circle cx="99" cy="100" r="8" fill="#fff"/><circle cx="96" cy="97" r="1.6" fill="#0B3B27" opacity=".3"/><circle cx="102" cy="101" r="1.6" fill="#0B3B27" opacity=".3"/></svg>`,
  `<svg viewBox="0 0 160 130"><rect x="26" y="12" width="108" height="106" rx="18" fill="#0F4530"/><path d="M60 34 q20 -14 44 2 q10 24 -6 44 q-26 14 -44 -4 q-10 -24 6 -42Z" fill="#1A6B44" stroke="rgba(214,249,75,.4)" stroke-width="1.5"/><g><circle cx="70" cy="46" r="7" fill="#D6F94B"/><rect x="68.6" y="46" width="2.8" height="12" rx="1.4" fill="#D6F94B"/></g><g><circle cx="96" cy="70" r="7" fill="#D6F94B"/><rect x="94.6" y="70" width="2.8" height="12" rx="1.4" fill="#D6F94B"/></g><circle cx="96" cy="70" r="12" fill="none" stroke="rgba(214,249,75,.5)" stroke-width="1.5"><animate attributeName="r" values="9;16" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;0" dur="1.6s" repeatCount="indefinite"/></circle></svg>`,
  `<svg viewBox="0 0 160 130"><circle cx="52" cy="66" r="22" fill="#1A6B44"/><circle cx="108" cy="66" r="22" fill="#14532D"/><circle cx="80" cy="52" r="26" fill="#D6F94B"/><path d="M74 46 a7 7 0 0 1 12 5 q0 7 -6 11 q-6 -4 -6 -11 a7 7 0 0 1 0 -5Z" fill="#0B3B27"/><path d="M44 62 a8 8 0 0 1 16 0 M100 62 a8 8 0 0 1 16 0" stroke="#D6F94B" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="58" y="92" width="44" height="18" rx="9" fill="#fff"/><circle cx="70" cy="101" r="2.4" fill="#0B3B27"/><circle cx="80" cy="101" r="2.4" fill="#0B3B27"/><circle cx="90" cy="101" r="2.4" fill="#0B3B27"/></svg>`,
];
function renderOb() {
  appEl.innerHTML = `
  <div class="ob view">
    <div class="ob-slides" id="ob-slides">
      <div class="ob-slide">
        <div class="ob-art">${OB_ARTS[0]}</div>
        <h2>일행이 취소한<br>그 티타임, <em>반값</em>이 됩니다</h2>
        <p>4인 예약에 한 명이 빠지면 남은 사람들이 위약금을 떠안죠. 라스트티에선 그 빈자리가 당신의 할인 티타임이 됩니다.</p>
      </div>
      <div class="ob-slide">
        <div class="ob-art">${OB_ARTS[1]}</div>
        <h2>전국 골프장의<br><em>빈자리</em>를 실시간으로</h2>
        <p>실제 지형 지도에서 지금 열려있는 모집을 한눈에. 티오프까지 남은 시간, 할인율, 동반자 매너 점수까지 확인하고 참여하세요.</p>
      </div>
      <div class="ob-slide">
        <div class="ob-art">${OB_ARTS[2]}</div>
        <h2>혼자 참여해도<br><em>크루</em>가 생깁니다</h2>
        <p>라운드가 끝나면 서로 그린지수를 남기고, 마음 맞는 골퍼들과 크루를 만들어 정기 라운드로 이어가세요.</p>
      </div>
    </div>
    <div class="ob-dots"><span class="ob-dot on"></span><span class="ob-dot"></span><span class="ob-dot"></span></div>
    <button class="btn btn-lime" onclick="location.hash='#/signup'">시작하기</button>
    <button class="ob-skip" onclick="obSkip()">먼저 둘러볼게요</button>
  </div>`;
  const slides = $("#ob-slides");
  slides.addEventListener("scroll", () => {
    const i = Math.round(slides.scrollLeft / slides.clientWidth);
    $$(".ob-dot").forEach((d, k) => d.classList.toggle("on", k === i));
  }, { passive: true });
}
window.obSkip = () => { S.seenOb = true; Store.save(); location.hash = "#/home"; };

/* ── 회원가입 / 프로필 설정 ───────────────── */
function renderSignup() {
  const u = S.user || {};
  const sel = { avatar: u.avatar ?? 2, g: u.g ?? 0, gender: u.gender || "남", age: u.age || "30대", career: u.career || CAREERS[2], region: u.region || "수도권", avg: u.avg || 95, styles: u.styles || [], verified: u.verified || false };
  appEl.innerHTML = `
  <div class="view form-page">
    <button class="back" style="width:38px;height:38px;border-radius:13px;background:var(--card);box-shadow:var(--shadow-sm);display:flex;align-items:center;justify-content:center" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button>
    <h1>${S.user ? "프로필 수정" : "라운드 나가기 전,<br>프로필을 만들어주세요"}</h1>

    <label class="f-label">닉네임</label>
    <div class="f-input"><i class="ph ph-golf" style="color:var(--ink-3)"></i><input id="su-nick" maxlength="10" placeholder="라운드에서 불릴 이름" value="${u.nick || ""}"></div>

    <label class="f-label">아바타</label>
    <div class="av-pick" id="su-av">${AV_GLYPHS.map((gl, i) => `<button class="av g${i % 6} ${i === sel.avatar ? "on" : ""}" data-a="${i}" data-g="${i % 6}"><svg viewBox="0 0 24 24">${gl}</svg></button>`).join("")}</div>

    <label class="f-label">성별 · 연령대</label>
    <div class="seg" id="su-gender">${["남", "여"].map(g => `<button class="${sel.gender === g ? "on" : ""}" data-v="${g}">${g}</button>`).join("")}</div>
    <div class="seg" id="su-age" style="margin-top:8px">${["20대", "30대", "40대", "50대+"].map(a => `<button class="${sel.age === a ? "on" : ""}" data-v="${a}">${a}</button>`).join("")}</div>

    <label class="f-label">구력</label>
    <div class="seg" id="su-career">${CAREERS.map(c => `<button class="${sel.career === c ? "on" : ""}" data-v="${c}">${c}</button>`).join("")}</div>

    <label class="f-label">평균 타수</label>
    <div class="range-val" id="su-avg-val">${sel.avg}타</div>
    <input type="range" id="su-avg" min="70" max="130" value="${sel.avg}">

    <label class="f-label">주 활동 지역</label>
    <div class="seg" id="su-region">${REGIONS.slice(1).map(r => `<button class="${sel.region === r ? "on" : ""}" data-v="${r}">${r}</button>`).join("")}</div>

    <label class="f-label">라운드 스타일 (복수 선택)</label>
    <div class="seg" id="su-style">${["초보환영", "빠른진행", "조용히 집중", "분위기 메이커", "새벽 티오프", "주말 오후"].map(s => `<button class="${sel.styles.includes(s) ? "on" : ""}" data-v="${s}">${s}</button>`).join("")}</div>

    <label class="f-label">신뢰 인증</label>
    <button class="f-input" id="su-verify" style="justify-content:flex-start">
      <i class="ph-fill ph-seal-check" style="color:${sel.verified ? "var(--green-2)" : "var(--ink-3)"};font-size:20px"></i>
      <span style="font-weight:700;font-size:14.5px">${sel.verified ? "휴대폰 본인인증 완료" : "휴대폰 본인인증 하기"}</span>
      <span style="margin-left:auto;font-size:12px;color:var(--ink-3)">노쇼 방지를 위해 필요해요</span>
    </button>

    <button class="btn btn-primary" id="su-go" style="margin-top:30px">${S.user ? "저장하기" : "라스트티 시작하기"}</button>
  </div>`;

  $("#su-av").addEventListener("click", e => {
    const b = e.target.closest(".av"); if (!b) return;
    $$("#su-av .av").forEach(x => x.classList.remove("on")); b.classList.add("on");
    sel.avatar = +b.dataset.a; sel.g = +b.dataset.g;
  });
  const segBind = (id, key) => $(id).addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$(id + " button").forEach(x => x.classList.remove("on")); b.classList.add("on");
    sel[key] = b.dataset.v;
  });
  segBind("#su-gender", "gender"); segBind("#su-age", "age"); segBind("#su-career", "career"); segBind("#su-region", "region");
  $("#su-style").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    b.classList.toggle("on");
    const v = b.dataset.v;
    sel.styles = sel.styles.includes(v) ? sel.styles.filter(x => x !== v) : [...sel.styles, v];
  });
  $("#su-avg").addEventListener("input", e => { sel.avg = +e.target.value; $("#su-avg-val").textContent = sel.avg + "타"; });
  $("#su-verify").addEventListener("click", function () {
    sel.verified = true;
    this.innerHTML = `<i class="ph-fill ph-seal-check" style="color:var(--green-2);font-size:20px"></i><span style="font-weight:700;font-size:14.5px">휴대폰 본인인증 완료</span><span style="margin-left:auto;font-size:12px;color:var(--green-2);font-weight:800">인증됨</span>`;
    toast("본인인증이 완료됐어요", "seal-check");
  });
  $("#su-go").addEventListener("click", () => {
    const nick = $("#su-nick").value.trim();
    if (!nick) { toast("닉네임을 입력해주세요", "warning"); $("#su-nick").focus(); return; }
    S.user = { nick, ...sel };
    S.seenOb = true;
    Store.save();
    toast(`${nick}님, 환영해요! 좋은 라운드 잡아드릴게요`);
    location.hash = "#/home";
  });
}

/* ── 홈 ──────────────────────────────── */
let homeState = { region: "전체", sort: "임박순", kind: "전체" };
const kindOf = p => isScreen(courseById(p.courseId)) ? "스크린" : "필드";
function renderHome() {
  const open = openPosts();
  const today = open.filter(p => teeDate(p).getDate() === BOOT.getDate() && teeDate(p) - BOOT < 864e5).sort((a, b) => teeDate(a) - teeDate(b));
  const avgOff = Math.round(open.reduce((s, p) => s + discount(p), 0) / (open.length || 1));
  const maxSave = Math.max(...open.map(p => p.normal - p.price), 0);
  const nickname = S.user ? S.user.nick + "님" : "골퍼님";
  const unread = unreadTotal();

  const filtered = open
    .filter(p => homeState.kind === "전체" || kindOf(p) === homeState.kind)
    .filter(p => homeState.region === "전체" || courseById(p.courseId).region === homeState.region)
    .sort((a, b) => homeState.sort === "임박순" ? teeDate(a) - teeDate(b) : homeState.sort === "할인순" ? discount(b) - discount(a) : a.price - b.price);

  appEl.innerHTML = `
  <div class="view">
    <div class="hero">
      <div class="hero-glow"></div>
      <svg class="hero-flight" viewBox="0 0 190 130"><path class="hf-path" d="M12 112 Q 95 -14 178 98"/><circle cx="178" cy="98" r="3.5" fill="#D6F94B"/></svg>
      <div class="hf-ball" style="position:absolute;top:52px;right:0;width:190px;height:130px;pointer-events:none"><span style="offset-path:path('M12 112 Q 95 -14 178 98');offset-rotate:0deg;position:absolute;width:9px;height:9px;border-radius:50%;background:#fff;box-shadow:0 0 10px rgba(255,255,255,.8);display:block"></span></div>
      <div class="hero-inner">
        <div class="hero-top">
          <div class="hero-logo"><span class="dot"></span>LASTTEE</div>
          <div class="hero-acts">
            <button class="hero-bell" onclick="location.hash='#/search'"><i class="ph-bold ph-magnifying-glass"></i></button>
            <button class="hero-bell" onclick="location.hash='#/chat'"><i class="ph-fill ph-chat-circle-dots"></i>${unread ? '<span class="badge red"></span>' : ""}</button>
            <button class="hero-bell" onclick="location.hash='#/alerts'"><i class="ph-fill ph-bell"></i><span class="badge"></span></button>
          </div>
        </div>
        <h1><span class="hl" style="animation-delay:.05s">${nickname},</span><br><span class="hl" style="animation-delay:.16s">지금 <em>빈자리 ${open.length}개</em>가</span><br><span class="hl" style="animation-delay:.27s">기다리고 있어요</span></h1>
        <div class="hero-sub">일행 취소로 비어버린 티타임에 할인가로 참여하세요</div>
        <div class="hero-stats">
          <div class="hs"><b id="st-today">0</b><span>마감 임박</span></div>
          <div class="hs"><b id="st-off">0%</b><span>평균 할인율</span></div>
          <div class="hs"><b id="st-save">₩0</b><span>최대 절약액</span></div>
        </div>
      </div>
    </div>

    <div class="hot-wrap">
      <div class="hot-scroll">${today.map(hotCard).join("") || '<div class="empty" style="width:100%"><b>오늘 마감 임박 모집이 없어요</b></div>'}</div>
    </div>

    <div class="ticker"><div class="ticker-in">
      <em>●</em>방금 이*현님이 블루원 상주 참여 확정, 47% 할인
      <em>●</em>5분 전 새 모집: 골프존파크 강남역점 오늘 밤 게임, 64% 할인
      <em>●</em>3분 전 김*연님이 클럽72 참여 신청
      <em>●</em>7분 전 새 모집: 설해원 GC 내일 11시, 37% 할인
      <em>●</em>12분 전 박*진님이 그린지수 5.0 후기를 받았어요
    </div></div>

    <div class="px" style="margin-top:16px">
      <button class="nb-banner in" onclick="location.hash='#/nearby'">
        <span class="nb-banner-ic"><i class="ph-fill ph-map-pin-area"></i></span>
        <span style="flex:1;text-align:left"><b style="display:block;font-size:14.5px;font-weight:800">동네 스크린 시세 지도</b>
        <span style="font-size:12px;color:var(--ink-3);font-weight:600">강남 · 홍대 · 판교 · 서면 · 둔산 · 제주, 시간대별 룸 가격 비교</span></span>
        <i class="ph-bold ph-caret-right" style="color:var(--ink-3)"></i>
      </button>
    </div>

    <div class="h-sec px"><h2>지금 참여할 수 있는 라운드</h2><span class="more" onclick="location.hash='#/map'">지도로 보기</span></div>
    <div class="chips" id="home-kind" style="padding-bottom:2px">
      ${["전체", "필드", "스크린", "연습장"].map(k => `<button class="chip kind ${homeState.kind === k ? "on" : ""}" data-k="${k}">${k === "필드" ? '<i class="ph-fill ph-golf"></i> ' : k === "스크린" ? '<i class="ph-fill ph-monitor-play"></i> ' : k === "연습장" ? '<i class="ph-fill ph-barbell"></i> ' : ""}${k}</button>`).join("")}
    </div>
    ${homeState.kind !== "연습장" ? `
    <div class="chips" id="home-chips">
      ${REGIONS.map(r => `<button class="chip ${homeState.region === r ? "on" : ""}" data-r="${r}">${r}</button>`).join("")}
      <button class="chip" id="home-sort" style="margin-left:auto">${homeState.sort} <i class="ph-bold ph-caret-down"></i></button>
    </div>` : ""}
    <div class="px" id="home-list">
      ${homeState.kind === "연습장"
        ? SUBS.map(subCard).join("")
        : filtered.map(postCard).join("") || `<div class="empty"><div class="big"><i class="ph ph-golf"></i></div><b>이 지역엔 아직 모집이 없어요</b><p>다른 지역을 보거나, 직접 모집을 올려보세요.</p></div>`}
    </div>

    ${homeState.kind === "전체" ? `
    <div class="h-sec px"><h2>연습장 구독 나눠쓰기</h2><span class="more" id="home-more-subs">전체 보기</span></div>
    <div class="px">${SUBS.slice(0, 2).map(s => `<div class="rv">${subCard(s)}</div>`).join("")}</div>` : ""}

    <div class="px rv" style="margin-top:28px">
      <div class="info-card">
        <h3>어떻게 <em>이 가격</em>이 가능해요?</h3>
        <div class="info-step"><span class="n">1</span><p>골프장은 <b>4인 기준 예약</b>이 원칙이라, 한 명이 빠지면 남은 일행이 <b>위약금과 미달 그린피</b>를 떠안아요.</p></div>
        <div class="info-step"><span class="n">2</span><p>호스트는 위약금을 무는 대신, <b>빈자리를 할인가에 양도</b>합니다. 서로에게 이득인 거래예요.</p></div>
        <div class="info-step"><span class="n">3</span><p>캐디피와 카트비도 <b>4명이 나눠</b> 1/N. 혼자였으면 못 갔을 라운드가 반값이 됩니다.</p></div>
      </div>
    </div>

    <div class="h-sec px"><h2>같이 칠 사람들</h2><span class="more" onclick="location.hash='#/crew'">크루 전체</span></div>
    <div class="px">
      ${CREWS.slice(0, 2).map(c => `<div class="rv">${crewCard(c)}</div>`).join("")}
    </div>

    <div class="px rv" style="margin-top:24px">
      <div class="partner-card">
        <div class="ic"><i class="ph-fill ph-handshake"></i></div>
        <b>골프장 파트너 제휴</b>
        <p>취소로 비는 티타임을 라스트티에 직접 올려보세요.<br>노쇼 손실을 매출로 바꿔드립니다.</p>
        <button class="btn btn-ghost btn-sm" style="margin:14px auto 0" onclick="toast('제휴 문의가 접수됐어요. 곧 연락드릴게요!','handshake')">제휴 문의하기</button>
      </div>
    </div>
  </div>`;

  countUp($("#st-today"), today.length);
  countUp($("#st-off"), avgOff, { suffix: "%" });
  countUp($("#st-save"), maxSave, { prefix: "₩" });
  stagger();
  bindRv();

  const hc = $("#home-chips");
  if (hc) hc.addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    if (b.id === "home-sort") {
      const order = ["임박순", "할인순", "낮은가격순"];
      homeState.sort = order[(order.indexOf(homeState.sort) + 1) % order.length];
    } else homeState.region = b.dataset.r;
    renderHome();
  });
  $("#home-kind").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    homeState.kind = b.dataset.k;
    renderHome();
  });
  const ms = $("#home-more-subs");
  if (ms) ms.addEventListener("click", () => { homeState.kind = "연습장"; renderHome(); window.scrollTo(0, 620); });
}

/* ── 지도 뷰 ───────────────────────────── */
let mapState = { kind: "전체", lat: 36.15, lng: 127.85, z: 7 };
let _bmAll = null;
function bmMarkers() {
  if (_bmAll) return _bmAll;
  _bmAll = [];
  COURSES.forEach(c => {
    const g = geoOf(c.id);
    if (!g) return;
    _bmAll.push({ id: c.id, name: c.name, lat: g.lat, lng: g.lng, scr: isScreen(c), rng: false, cur: true });
  });
  DIRV.forEach((v, i) => {
    if (!v.lat) return;
    _bmAll.push({ id: "dv" + i, name: v.n, lat: v.lat, lng: v.lng, scr: v.k === "s", rng: v.k === "r", cur: false });
  });
  return _bmAll;
}
function bmClamp() {
  mapState.lat = Math.max(32.6, Math.min(39.3, mapState.lat));
  mapState.lng = Math.max(124.3, Math.min(131.6, mapState.lng));
  mapState.z = Math.max(6, Math.min(16, mapState.z));
}
function mountBigMap() {
  const box = $("#big-map");
  if (!box) return;
  bmClamp();
  const w = box.clientWidth, h = box.clientHeight;
  if (w < 60 || h < 60) { requestAnimationFrame(() => mountBigMap()); return; }
  const z = mapState.z;
  const [xf, yf] = tileXY(mapState.lat, mapState.lng, z);
  const cx = xf * 256, cy = yf * 256;
  const maxT = 2 ** z;
  let html = "";
  const tx0 = Math.floor((cx - w / 2) / 256), tx1 = Math.floor((cx + w / 2) / 256);
  const ty0 = Math.floor((cy - h / 2) / 256), ty1 = Math.floor((cy + h / 2) / 256);
  for (let tx = tx0; tx <= tx1; tx++) for (let ty = ty0; ty <= ty1; ty++) {
    if (ty < 0 || ty >= maxT) continue;
    const left = tx * 256 - (cx - w / 2), top = ty * 256 - (cy - h / 2);
    const sub = "abcd"[Math.abs(tx + ty) % 4];
    html += `<img class="bm-tile" style="left:${left}px;top:${top}px" src="https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${((tx % maxT) + maxT) % maxT}/${ty}@2x.png" alt="">`;
  }
  // 줌 레벨별 점진 표시(LOD): 확대할수록 더 많은 점 + 이름
  const dotPx = z <= 8 ? 6 : z <= 10 ? 9 : z <= 12 ? 12 : 15;
  const K = mapState.kind;
  let shown = 0, pinsHtml = "";
  for (const m of bmMarkers()) {
    if (K === "필드" && (m.scr || m.rng)) continue;
    if (K === "스크린" && !m.scr) continue;
    if (K === "연습장" && !m.rng) continue;
    if (K === "전체" && m.rng && z < 11) continue; // 연습장은 동네 줌부터
    const [vx, vy] = tileXY(m.lat, m.lng, z);
    const px = vx * 256 - (cx - w / 2), py = vy * 256 - (cy - h / 2);
    if (px < -50 || px > w + 50 || py < -50 || py > h + 50) continue;
    shown++;
    const posts = postsForCourse(m.id).length;
    if (posts > 0) {
      pinsHtml += `<button class="pin ${m.scr ? "pin-scr" : ""}" style="left:${px}px;top:${py}px" onclick="bmTap('${m.id}')">
        <span class="pin-dot"><i class="ph-fill ${m.scr ? "ph-monitor-play" : "ph-golf"}"></i></span>
        <span class="pin-n">${m.name.split(" ")[0]} · ${posts}</span></button>`;
      continue;
    }
    const label = (m.cur && z >= 9) || z >= 11;
    if (label) {
      html += `<button class="bm-m" style="left:${px}px;top:${py}px" onclick="bmTap('${m.id}')">
        <span class="bm-d ${m.scr ? "scr" : m.rng ? "rng" : ""}" style="width:${dotPx}px;height:${dotPx}px"></span>
        <span class="bm-name">${m.name}</span></button>`;
    } else {
      html += `<button class="bm-dot ${m.scr ? "scr" : m.rng ? "rng" : ""}" style="left:${px}px;top:${py}px;width:${dotPx}px;height:${dotPx}px" onclick="bmTap('${m.id}')" aria-label="${m.name}"></button>`;
    }
  }
  html += pinsHtml;
  box.innerHTML = `<div class="bm-layer" id="bm-layer">${html}</div>
    <div class="bm-hint">${shown.toLocaleString()}곳 표시${z < 11 ? " · 확대하면 이름이 보여요" : ""}</div>
    <div class="nb-attr">지도 © OpenStreetMap · CARTO</div>`;
}
window.bmTap = id => {
  const box = $("#big-map");
  if (box && box._sup && Date.now() - box._sup < 400) return;
  pinSheet(id);
};
window.bmZoom = d => { mapState.z += d; mountBigMap(); };
window.bmLocate = () => {
  if (!navigator.geolocation) { toast("위치를 사용할 수 없어요", "warning"); return; }
  navigator.geolocation.getCurrentPosition(p => {
    mapState.lat = p.coords.latitude; mapState.lng = p.coords.longitude;
    mapState.z = Math.max(mapState.z, 11);
    mountBigMap();
    toast("내 주변으로 이동했어요", "crosshair");
  }, () => toast("위치 권한이 필요해요", "warning"), { timeout: 5000 });
};
function bindBigMap() {
  const box = $("#big-map");
  if (!box || box._bound) return;
  box._bound = true;
  const ptrs = new Map();
  let start = null, pinchD = 0;
  const layer = () => $("#bm-layer");
  box.addEventListener("pointerdown", e => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    box.setPointerCapture(e.pointerId);
    if (ptrs.size === 1) start = { x: e.clientX, y: e.clientY, dx: 0, dy: 0, moved: false };
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinchD = Math.hypot(a.x - b.x, a.y - b.y);
      start = null;
      const l = layer(); if (l) l.style.transform = "";
    }
  });
  box.addEventListener("pointermove", e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2 && pinchD) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > pinchD * 1.3) { bmZoom(1); pinchD = d; box._sup = Date.now(); }
      else if (d < pinchD * 0.75) { bmZoom(-1); pinchD = d; box._sup = Date.now(); }
      return;
    }
    if (!start) return;
    start.dx = e.clientX - start.x; start.dy = e.clientY - start.y;
    if (Math.hypot(start.dx, start.dy) > 5) start.moved = true;
    const l = layer(); if (l) l.style.transform = `translate(${start.dx}px,${start.dy}px)`;
  });
  const end = e => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinchD = 0;
    if (!start) return;
    if (start.moved) {
      box._sup = Date.now();
      const z = mapState.z, scale = 256 * 2 ** z;
      const [xf, yf] = tileXY(mapState.lat, mapState.lng, z);
      const nx = xf * 256 - start.dx, ny = yf * 256 - start.dy;
      mapState.lng = (nx / scale) * 360 - 180;
      const n = Math.PI - (2 * Math.PI * ny) / scale;
      mapState.lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
      mountBigMap();
    }
    start = null;
  };
  box.addEventListener("pointerup", end);
  box.addEventListener("pointercancel", end);
  box.addEventListener("wheel", e => { e.preventDefault(); bmZoom(e.deltaY < 0 ? 1 : -1); }, { passive: false });
  box.addEventListener("dblclick", e => { e.preventDefault(); bmZoom(1); });
}
function renderMap() {
  const open = openPosts();
  appEl.innerHTML = `
  <div class="view">
    <div class="page-head"><h1>빈자리 지도</h1>
      <span style="margin-left:auto" class="tag lime"><i class="ph-fill ph-lightning"></i>실시간 ${open.length}건</span>
    </div>
    <div class="chips" id="map-kind" style="padding-bottom:10px">
      ${["전체", "필드", "스크린", "연습장"].map(k => `<button class="chip ${mapState.kind === k ? "on" : ""}" data-k="${k}">${k === "필드" ? '<i class="ph-fill ph-golf"></i> ' : k === "스크린" ? '<i class="ph-fill ph-monitor-play"></i> ' : k === "연습장" ? '<i class="ph-fill ph-barbell"></i> ' : ""}${k}</button>`).join("")}
      <button class="chip" style="margin-left:auto;background:var(--green);border-color:var(--green);color:var(--lime)" onclick="location.hash='#/nearby'"><i class="ph-fill ph-map-pin-area"></i> 동네 시세</button>
      <button class="chip" onclick="location.hash='#/search'"><i class="ph-bold ph-magnifying-glass"></i> 검색</button>
    </div>
    <div class="px"><div class="bm-wrap in">
      <div id="big-map"></div>
      <div class="nb-zoom">
        <button onclick="bmZoom(1)"><i class="ph-bold ph-plus"></i></button>
        <button onclick="bmZoom(-1)"><i class="ph-bold ph-minus"></i></button>
        <button onclick="bmLocate()"><i class="ph-bold ph-crosshair-simple"></i></button>
      </div>
    </div></div>
    <div class="px" style="margin-top:14px">
      <div class="d-card in" style="margin:0;padding:16px 18px;display:flex;gap:14px;align-items:center;flex-wrap:wrap">
        <span style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--ink-2)"><span style="width:12px;height:12px;border-radius:50%;background:#7CB342;display:inline-block"></span>필드</span>
        <span style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--ink-2)"><span style="width:12px;height:12px;border-radius:50%;background:#4D8DE8;display:inline-block"></span>스크린</span>
        <span style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--ink-2)"><span style="width:12px;height:12px;border-radius:50%;background:#9C6ADE;display:inline-block"></span>연습장</span>
        <span style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--ink-2)"><i class="ph-fill ph-hand-tap" style="font-size:14px"></i>드래그 이동 · 핀치 확대</span>
      </div>
    </div>
    <div class="h-sec px"><h2>파트너 골프장 · 매장</h2></div>
    <div class="px">
      ${COURSES.filter(c => c.partner).map(c => `
        <div class="map-sheet-card in" onclick="location.hash='#/course/${c.id}'">
          <div class="sat" style="width:56px;height:56px;border-radius:16px;flex:none">${satShot(c, isScreen(c) ? 17 : 14)}</div>
          <div style="flex:1"><b style="font-size:14.5px">${c.name} <span class="tag green" style="font-size:10px;vertical-align:1px">파트너</span></b>
            <div style="font-size:12px;color:var(--ink-3);font-weight:600;margin-top:3px">${c.city} · ${c.rating}점 (${c.ratingN.toLocaleString()})</div></div>
          <i class="ph-bold ph-caret-right" style="color:var(--ink-3)"></i>
        </div>`).join("")}
    </div>
  </div>`;
  stagger();
  requestAnimationFrame(() => { mountBigMap(); bindBigMap(); });
  setTimeout(() => { const b = $("#big-map"); if (b && !b.querySelector(".bm-tile")) mountBigMap(); }, 400);
  $("#map-kind").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b || !b.dataset.k) return;
    mapState.kind = b.dataset.k;
    $$("#map-kind .chip").forEach(x => x.classList.toggle("on", x === b));
    mountBigMap();
  });
}

/* ── 모집 상세 ─────────────────────────── */
function renderPost(id) {
  const p = postById(id);
  if (!p) { location.hash = "#/home"; return; }
  const c = courseById(p.courseId);
  const scr = isScreen(c);
  const left = slotsLeft(p);
  const joined = S.joined.includes(p.id);
  const mine = p.hostId === "me";
  const js = joinerIds(p);
  const hrs = p.hours || 2;
  const night = teeDate(p).getHours() >= 18 || teeDate(p).getHours() < 6;
  const roomTotal = scr && c.room ? (night ? c.room.night : c.room.day) * hrs : 0;
  const roomEach = scr ? Math.round(roomTotal / p.total) : 0;
  const caddyEach = !scr && c.caddy ? Math.round(c.caddy / p.total) : 0;
  const cartEach = !scr && c.cart ? Math.round(c.cart / p.total) : 0;

  appEl.innerHTML = `
  <div class="view" style="padding-bottom:120px">
    <button class="d-back" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button>
    <button class="d-share" onclick="sharePost('${p.id}')"><i class="ph-bold ph-share-network"></i></button>
    <div class="detail-hero sat">${satShot(c, scr ? 17 : 15, scr ? "매장 인근 위성 (Esri)" : "실제 위성 전경 (Esri)")}</div>

    <div class="float-hero-off">
      <div class="d-card in">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
          <span class="tag red">${discount(p)}% 할인</span>
          ${scr ? '<span class="tag blue"><i class="ph-fill ph-monitor-play"></i>스크린</span>' : ""}
          ${p.instant ? '<span class="tag green"><i class="ph-fill ph-lightning"></i>즉시확정</span>' : '<span class="tag">호스트 승인제</span>'}
          <span class="tag">${p.level}</span>
          ${p.genderPref !== "무관" ? `<span class="tag lime">${p.genderPref}</span>` : ""}
        </div>
        <div style="font-size:21px;font-weight:900;letter-spacing:-.02em">${c.name}</div>
        <div style="margin-top:6px;font-size:13.5px;color:var(--ink-2);font-weight:600">
          <i class="ph-fill ph-calendar-check" style="color:var(--green-2)"></i> ${dayLabel(p)} ${teeStr(p)} 시작 · ${scr ? p.holes + "홀 게임 · 룸 " + hrs + "시간" : p.holes + "홀"}
        </div>
        <div style="margin-top:4px;font-size:13.5px;color:var(--ink-2);font-weight:600">
          <i class="ph-fill ph-map-pin" style="color:var(--green-2)"></i> ${c.addr || c.city} · ${c.type}
        </div>
        <div style="margin-top:14px;background:var(--green-deep);color:#fff;border-radius:14px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;font-weight:700;color:rgba(255,255,255,.7)">${scr ? "게임 시작까지" : "티오프까지"}</span>
          <b class="countdown" style="font-size:19px;color:var(--lime)" data-cd="${teeDate(p).getTime()}">00:00</b>
        </div>
      </div>

      <div class="d-card in">
        <h3><i class="ph-fill ph-receipt"></i>1인 비용 (총 ${p.total}인 기준)</h3>
        ${scr ? `
        <div class="fee-row"><span>빈자리 그대로면 1인 부담</span><b><del style="color:var(--ink-3);font-weight:600">${won(p.normal)}</del></b></div>
        ${roomTotal ? `
        <div class="fee-row"><span>룸 대여 ${hrs}시간 (팀당)</span><b>${won(roomTotal)}</b></div>
        <div class="fee-row"><span>${p.total}인 채우면 룸비 1/${p.total}</span><b>${won(roomEach)}</b></div>` : ""}
        <div class="fee-row"><span>절약되는 금액</span><b class="save">${won(p.normal - p.price)} 절약</b></div>
        ` : `
        <div class="fee-row"><span>정상가 (그린피+캐디+카트)</span><b><del style="color:var(--ink-3);font-weight:600">${won(p.normal)}</del></b></div>
        ${caddyEach ? `<div class="fee-row"><span>캐디피 1/${p.total}</span><b>${won(caddyEach)} 포함</b></div>` : ""}
        ${cartEach ? `<div class="fee-row"><span>카트비 1/${p.total}</span><b>${won(cartEach)} 포함</b></div>` : ""}
        <div class="fee-row"><span>절약되는 금액</span><b class="save">${won(p.normal - p.price)} 절약</b></div>
        `}
        <div class="fee-row total"><span>라스트티 참여가</span><b>${won(p.price)}</b></div>
        <div style="margin-top:10px;font-size:12px;color:var(--ink-3);font-weight:600;display:flex;align-items:center;gap:6px"><i class="ph-fill ph-bank"></i>결제: 현장결제 또는 계좌이체 중 선택</div>
      </div>

      <div class="d-card in">
        <h3><i class="ph-fill ph-users-three"></i>이 팀의 멤버 <span style="color:var(--red);font-size:13px">· ${left}자리 남음</span></h3>
        ${js.map(jid => { const h = personOf(jid); return `
          <div class="joiner-row" ${h.id !== "me" ? `onclick="location.hash='#/user/${h.id}'"` : ""}>
            ${avat(h)}
            <div><div class="jr-name">${h.name}${jid === p.hostId ? '<span class="host-chip">호스트</span>' : ""}${h.id === "me" ? ' <span class="tag lime" style="font-size:10px">나</span>' : ""}</div>
            <div class="jr-sub">${h.career} · 평균 ${h.avg}타</div></div>
            <div class="jr-temp"><b>${(h.temp || 5).toFixed(1)}</b><span>그린지수</span></div>
          </div>`; }).join("")}
        ${Array.from({ length: left }, () => `<div class="slot-empty"><div class="dash"><i class="ph ph-plus"></i></div><span style="font-size:13.5px;font-weight:600">이 자리가 비어있어요</span></div>`).join("")}
      </div>

      <div class="d-card in">
        <h3><i class="ph-fill ph-chat-circle-text"></i>호스트의 한마디</h3>
        <p style="font-size:14.5px;line-height:1.65;color:var(--ink-2);font-weight:500">"${p.memo}"</p>
        <div style="margin-top:12px;font-size:12px;color:var(--ink-3);font-weight:600">사유: ${p.reason} · ${p.ago || "방금 전"} 게시</div>
        ${!mine ? `<button class="btn btn-ghost btn-sm" style="margin-top:12px" onclick="openChat('${p.hostId}')"><i class="ph-fill ph-chat-circle-dots"></i>호스트에게 메시지</button>` : ""}
      </div>

      <div class="d-card in">
        <h3><i class="ph-fill ${scr ? "ph-monitor-play" : "ph-golf"}"></i>${c.name}</h3>
        <div class="spec-grid">
          ${scr ? `
          <div class="spec"><b>${c.rooms ? "룸 " + c.rooms + "개" : "스크린"}</b><span>규모</span></div>
          <div class="spec"><b>${c.brandShort}</b><span>시뮬레이터</span></div>
          <div class="spec"><b>${c.hoursOpen === "24시간" ? "24시간" : "심야"}</b><span>운영</span></div>
          ` : `
          <div class="spec"><b>${c.holes}홀</b><span>규모</span></div>
          <div class="spec"><b>파 ${c.par}</b><span>레귤러</span></div>
          <div class="spec"><b>${c.len || "실측"}</b><span>전장</span></div>
          `}
          <div class="spec"><b>${c.rating ? c.rating + "점" : "신규"}</b><span>${c.rating ? c.ratingN.toLocaleString() + "개 평가" : "평가 준비 중"}</span></div>
        </div>
        <div class="gallery" style="margin-top:14px">
          ${scr ? `
          <div class="g-shot sat">${satShot(c, 17)}<span class="g-cap">매장 인근</span></div>
          <div class="g-shot sat">${satShot(c, 15)}<span class="g-cap">동네 전경</span></div>
          <div class="g-shot sat">${satShot(c, 13)}<span class="g-cap">도시 전경</span></div>
          ` : `
          <div class="g-shot sat">${satShot(c, 16)}<span class="g-cap">그린 클로즈업</span></div>
          <div class="g-shot sat">${satShot(c, 15)}<span class="g-cap">코스 전경</span></div>
          <div class="g-shot sat">${satShot(c, 14)}<span class="g-cap">주변 지형</span></div>
          `}
        </div>
        <p style="margin-top:14px;font-size:13.5px;line-height:1.65;color:var(--ink-2);font-weight:500">${c.desc}</p>
        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn btn-ghost btn-sm" style="flex:1" onclick="location.hash='#/course/${c.id}'">상세 · 요금표</button>
          <button class="btn btn-sm" style="flex:1.4;background:#03C75A;color:#fff" onclick="nmap('${c.name.replace(/'/g, "")} ${c.city.split(" ")[0]}')"><span style="width:16px;height:16px;border-radius:4px;background:#fff;color:#03C75A;font-weight:900;font-size:11px;display:inline-flex;align-items:center;justify-content:center">N</span>네이버 지도</button>
        </div>
      </div>

      <div class="d-card in">
        <h3><i class="ph-fill ph-shield-check"></i>안심 참여 규칙</h3>
        <div class="info-step" style="margin-top:4px"><span class="n">1</span><p><b>무료 취소</b>는 시작 ${scr ? "3시간" : "24시간"} 전까지. 이후 취소 시 참여가의 50%가 위약금으로 부과돼요.</p></div>
        <div class="info-step"><span class="n">2</span><p><b>노쇼</b>는 그린지수가 크게 깎이고, 3회 누적 시 이용이 제한됩니다.</p></div>
        ${scr
          ? `<div class="info-step"><span class="n">3</span><p>룸비는 호스트가 결제해두고, 참여자는 <b>현장결제 또는 계좌이체</b>로 1/N 정산해요.</p></div>`
          : `<div class="info-step"><span class="n">3</span><p>그린피는 골프장에서 각자 결제하고, 캐디피와 카트비는 <b>현장결제 또는 계좌이체</b>로 1/N 정산해요.</p></div>`}
      </div>
    </div>
  </div>

  <div class="cta-bar">
    <div class="cta-price"><b>${won(p.price)}</b><span>${discount(p)}% 할인 · ${left}자리</span></div>
    ${!mine ? `<button class="cta-chat" onclick="openChat('${p.hostId}')"><i class="ph-fill ph-chat-circle-dots"></i></button>` : ""}
    ${mine
      ? `<button class="btn btn-danger" onclick="closeMyPost('${p.id}')">모집 마감하기</button>`
      : joined
        ? `<button class="btn btn-ghost" onclick="cancelJoin('${p.id}')">참여 취소</button>`
        : `<button class="btn btn-primary" ${left === 0 ? "disabled" : ""} onclick="askJoin('${p.id}')">${left === 0 ? "마감됐어요" : p.instant ? "바로 참여 확정하기" : "참여 신청하기"}</button>`}
  </div>`;
  stagger();
}

window.sharePost = id => {
  const p = postById(id); const c = courseById(p.courseId);
  const text = `[라스트티] ${c.name} ${dayLabel(p)} ${teeStr(p)} 티오프, ${discount(p)}% 할인 참여 (${won(p.price)})`;
  if (navigator.share) navigator.share({ title: "라스트티", text, url: location.href }).catch(() => {});
  else { navigator.clipboard?.writeText(text + " " + location.href); toast("링크가 복사됐어요", "link"); }
};

/* 참여 신청 + 결제 수단 선택 */
let joinPay = null;
window.setJoinPay = v => {
  joinPay = v;
  $$("#pay-radios .radio-row").forEach(r => r.classList.toggle("on", r.dataset.v === v));
};
window.askJoin = id => {
  if (!S.user) { toast("참여하려면 프로필이 필요해요", "user-circle-plus"); location.hash = "#/signup"; return; }
  const p = postById(id); const c = courseById(p.courseId);
  joinPay = S.payPref || "onsite";
  openSheet(`
    <div style="text-align:center;padding:6px 0 2px">
      <div class="sheet-ic"><i class="ph-fill ph-golf"></i></div>
      <div style="font-size:19px;font-weight:900;margin-top:12px">${p.instant ? "바로 확정할까요?" : "참여를 신청할까요?"}</div>
      <p style="font-size:13.5px;color:var(--ink-2);margin-top:8px;line-height:1.6;font-weight:500">
        ${c.name} · ${dayLabel(p)} ${teeStr(p)}<br>
        <b style="font-size:16px">${won(p.price)}</b> <span style="color:var(--red);font-weight:800">(${won(p.normal - p.price)} 절약)</span>
      </p>
      <div id="pay-radios" style="margin-top:16px;text-align:left">
        <div class="radio-row ${joinPay === "onsite" ? "on" : ""}" data-v="onsite" onclick="setJoinPay('onsite')">
          <span class="rd"></span>
          <div><b>현장결제</b><p>골프장 프론트에서 각자 결제</p></div>
          <i class="ph-fill ph-storefront" style="margin-left:auto;font-size:22px;color:var(--ink-3)"></i>
        </div>
        <div class="radio-row ${joinPay === "transfer" ? "on" : ""}" data-v="transfer" onclick="setJoinPay('transfer')">
          <span class="rd"></span>
          <div><b>계좌이체</b><p>확정 후 호스트 정산 계좌가 채팅으로 안내돼요</p></div>
          <i class="ph-fill ph-bank" style="margin-left:auto;font-size:22px;color:var(--ink-3)"></i>
        </div>
      </div>
      <div style="background:var(--bg);border-radius:14px;padding:12px;margin-top:8px;font-size:12.5px;color:var(--ink-2);font-weight:600;text-align:left;line-height:1.6">
        티오프 24시간 전까지 무료 취소돼요.<br>호스트에게 회원님의 프로필과 그린지수가 공개돼요.
      </div>
      <button class="btn btn-primary" style="margin-top:16px" onclick="doJoin('${p.id}')">${p.instant ? "참여 확정" : "신청 보내기"}</button>
      <button class="btn btn-ghost" style="margin-top:8px" onclick="closeSheet()">다시 볼게요</button>
    </div>
  `);
};
window.doJoin = id => {
  const p = postById(id);
  if (!S.joined.includes(id)) S.joined.push(id);
  S.payPref = joinPay || "onsite";
  Store.save();
  closeSheet();
  if (joinPay === "transfer" && p.hostId !== "me" && hostById(p.hostId)) {
    const h = hostById(p.hostId);
    if (!S.chats[p.hostId]) S.chats[p.hostId] = [];
    scheduleReply(p.hostId, `참여 확정 감사합니다! 캐디피와 카트비 정산 계좌는 라운드 당일 안내드릴게요. 그린피는 골프장 프론트에서 결제하시면 됩니다. 당일 뵐게요, ${h.name}입니다.`);
    toast(p.instant ? "참여 확정! 정산 안내가 채팅으로 도착해요" : "신청 완료! 호스트 승인을 기다려주세요");
  } else {
    toast(p.instant ? "참여 확정! 예정 라운드에 추가했어요" : "신청 완료! 호스트 승인을 기다려주세요");
  }
  renderPost(id);
};
window.cancelJoin = id => {
  const p = postById(id);
  const freeH = isScreen(courseById(p.courseId)) ? 3 : 24;
  const hoursLeft = (teeDate(p) - Date.now()) / 3600e3;
  openSheet(`
    <div style="text-align:center;padding:6px 0 2px">
      <div class="sheet-ic" style="background:#FDEBEC;color:var(--red)"><i class="ph-fill ph-calendar-x"></i></div>
      <div style="font-size:19px;font-weight:900;margin-top:12px">참여를 취소할까요?</div>
      <p style="font-size:13.5px;color:var(--ink-2);margin-top:8px;font-weight:500;line-height:1.6">
        ${hoursLeft >= freeH ? `시작 ${freeH}시간 전이라 <b>무료 취소</b>예요.` : `시작까지 ${freeH}시간이 안 남아<br><b style="color:var(--red)">참여가의 50% 위약금</b>이 발생해요.`}
      </p>
      <button class="btn btn-danger" style="margin-top:16px" onclick="doCancel('${id}')">취소하기</button>
      <button class="btn btn-ghost" style="margin-top:8px" onclick="closeSheet()">계속 함께할래요</button>
    </div>
  `);
};
window.doCancel = id => {
  S.joined = S.joined.filter(x => x !== id);
  Store.save(); closeSheet();
  toast("참여가 취소됐어요");
  renderPost(id);
};
window.closeMyPost = id => {
  S.closed.push(id);
  Store.save();
  toast("모집을 마감했어요");
  location.hash = "#/home";
};

/* ── 골프장 상세 ────────────────────────── */
function renderCourse(id) {
  const c = courseById(id);
  if (!c) { location.hash = "#/home"; return; }
  const scr = isScreen(c);
  const posts = postsForCourse(id);
  appEl.innerHTML = `
  <div class="view" style="padding-bottom:40px">
    <button class="d-back" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button>
    <div class="detail-hero sat">${satShot(c, scr ? 17 : 15, scr ? "매장 인근 위성 (Esri)" : "실제 위성 전경 (Esri)")}</div>
    <div class="float-hero-off">
      <div class="d-card in">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
          ${c.partner ? '<span class="tag green"><i class="ph-fill ph-handshake"></i>라스트티 파트너</span>' : ""}
          <span class="tag ${scr ? "blue" : ""}">${scr ? '<i class="ph-fill ph-monitor-play"></i>' : ""}${c.type}</span>
          ${c.tags.map(t => `<span class="tag lime">${t}</span>`).join("")}
        </div>
        <div style="font-size:22px;font-weight:900;letter-spacing:-.02em">${c.name}</div>
        ${c.eng || c.open || (scr && c.brand) ? `<div style="font-size:12.5px;color:var(--ink-3);font-weight:600;margin-top:3px">${c.eng}${c.open ? " · " + c.open + "년 개장" : ""}${scr && c.brand ? " · " + c.brand : ""}</div>` : ""}
        <div style="font-size:13px;color:var(--ink-2);font-weight:600;margin-top:8px"><i class="ph-fill ph-map-pin" style="color:var(--green-2)"></i> ${c.addr || c.city}</div>
        <div class="spec-grid" style="margin-top:16px">
          ${scr ? `
          <div class="spec"><b>${c.rooms ? "룸 " + c.rooms + "개" : "스크린"}</b><span>규모</span></div>
          <div class="spec"><b>${c.brandShort}</b><span>시뮬레이터</span></div>
          <div class="spec"><b>${c.hoursOpen || "매장 문의"}</b><span>운영</span></div>
          ` : `
          <div class="spec"><b>${c.holes}홀</b><span>규모</span></div>
          <div class="spec"><b>파 ${c.par}</b><span>레귤러</span></div>
          <div class="spec"><b>${c.len || "실측"}</b><span>전장</span></div>
          `}
          <div class="spec"><b>${c.rating ? c.rating + "점" : "신규"}</b><span>${c.rating ? c.ratingN.toLocaleString() + "개 평가" : "평가 준비 중"}</span></div>
        </div>
        <p style="margin-top:16px;font-size:14px;line-height:1.7;color:var(--ink-2);font-weight:500">${c.desc}</p>
        <div style="margin-top:14px">${naverBtn(c)}</div>
      </div>

      <div class="d-card in">
        <h3><i class="ph-fill ph-images"></i>${scr ? "매장 위치" : "실제 코스 전경"}</h3>
        <div class="gallery">
          ${scr ? `
          <div class="g-shot sat">${satShot(c, 17)}<span class="g-cap">매장 인근</span></div>
          <div class="g-shot sat">${satShot(c, 15)}<span class="g-cap">동네 전경</span></div>
          <div class="g-shot sat">${satShot(c, 13)}<span class="g-cap">도시 전경</span></div>
          ` : `
          <div class="g-shot sat">${satShot(c, 16)}<span class="g-cap">그린 클로즈업</span></div>
          <div class="g-shot sat">${satShot(c, 15)}<span class="g-cap">코스 전경</span></div>
          <div class="g-shot sat">${satShot(c, 14)}<span class="g-cap">주변 지형</span></div>
          `}
        </div>
        <p style="margin-top:10px;font-size:11px;color:var(--ink-3);font-weight:600">위성 이미지 Esri World Imagery 제공</p>
      </div>

      <div class="d-card in">
        <h3><i class="ph-fill ph-currency-krw"></i>정상 요금표</h3>
        ${scr && c.room ? `
        <div class="fee-row"><span>룸 대여 주간 (시간당)</span><b>${won(c.room.day)}</b></div>
        <div class="fee-row"><span>룸 대여 야간 (시간당)</span><b>${won(c.room.night)}</b></div>
        <div class="fee-row"><span>18홀 1게임 (1인)</span><b>${won(c.game)}</b></div>
        <div class="fee-row"><span>연습 모드 (1시간)</span><b>${won(c.practice)}</b></div>
        ` : !scr && c.green ? `
        <div class="fee-row"><span>그린피 (주중)</span><b>${won(c.green.wd)}</b></div>
        <div class="fee-row"><span>그린피 (주말)</span><b>${won(c.green.we)}</b></div>
        <div class="fee-row"><span>캐디피 (팀당)</span><b>${won(c.caddy)}</b></div>
        <div class="fee-row"><span>카트비 (팀당)</span><b>${won(c.cart)}</b></div>
        ` : `
        <p style="font-size:13.5px;color:var(--ink-2);font-weight:600;line-height:1.6">아직 요금 정보가 등록되지 않은 곳이에요. 아래 네이버 지도 버튼으로 최신 요금과 예약 정보를 확인하세요.</p>
        `}
        <p style="margin-top:10px;font-size:11.5px;color:var(--ink-3);font-weight:600">시즌과 요일에 따라 달라질 수 있어요. 정확한 요금은 네이버 지도에서 확인하세요.</p>
      </div>

      ${c.facilities.length ? `
      <div class="d-card in">
        <h3><i class="ph-fill ph-buildings"></i>시설</h3>
        <div class="facil">${c.facilities.map(f => `<span class="tag">${f}</span>`).join("")}</div>
      </div>` : ""}

      <div class="d-card in">
        <h3><i class="ph-fill ph-lightning"></i>진행 중인 모집 ${posts.length ? `<span class="tag red" style="margin-left:2px">${posts.length}건</span>` : ""}</h3>
        ${posts.length ? posts.map(p => `
          <div class="map-sheet-card" style="box-shadow:none;background:var(--bg);margin-bottom:8px" onclick="location.hash='#/post/${p.id}'">
            <div style="flex:1"><b style="font-size:14px">${dayLabel(p)} ${teeStr(p)} · ${p.holes}홀</b>
            <div style="font-size:12px;color:var(--ink-3);font-weight:600;margin-top:2px">${slotsLeft(p)}자리 · ${personOf(p.hostId).name} 호스트</div></div>
            <div style="text-align:right"><b style="font-weight:900">${won(p.price)}</b><div style="font-size:11px;color:var(--red);font-weight:800">${discount(p)}% 할인</div></div>
          </div>`).join("")
          : '<p style="font-size:13.5px;color:var(--ink-3);font-weight:600">지금은 열린 모집이 없어요. 첫 모집을 올려보세요!</p>'}
        <button class="btn btn-primary" style="margin-top:12px" onclick="location.hash='#/new'">이 골프장에서 모집 올리기</button>
      </div>
    </div>
  </div>`;
  stagger();
}

/* ── 모집 올리기 ────────────────────────── */
function renderNew() {
  if (!S.user) { toast("모집을 올리려면 프로필이 필요해요", "user-circle-plus"); location.hash = "#/signup"; return; }
  const st = { kind: "field", courseId: COURSES[0].id, day: 0, tee: "07:30", holes: 18, hours: 2, slots: 1, normal: 280000, price: 170000, tags: [], level: "누구나", memo: "", pay: "onsite" };
  const venueOpts = kind => {
    const list = COURSES.filter(c => kind === "screen" ? isScreen(c) : !isScreen(c));
    return REGIONS.slice(1).map(r => {
      const rs = list.filter(c => c.region === r);
      if (!rs.length) return "";
      return `<optgroup label="${r}">${rs.map(c => `<option value="${c.id}">${c.name} (${c.city})</option>`).join("")}</optgroup>`;
    }).join("");
  };
  appEl.innerHTML = `
  <div class="view form-page" style="padding-bottom:120px">
    <div style="display:flex;align-items:center;gap:12px">
      <button style="width:38px;height:38px;border-radius:13px;background:var(--card);box-shadow:var(--shadow-sm);display:flex;align-items:center;justify-content:center" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button>
      <h1 style="margin:0;font-size:22px">빈자리 모집 올리기</h1>
    </div>
    <p style="margin-top:10px;font-size:13.5px;color:var(--ink-2);font-weight:500;line-height:1.6">일행이 취소됐나요? 위약금 대신 빈자리를 할인가로 양도하세요. 평균 <b>30분 안에</b> 채워집니다.</p>

    <label class="f-label">종류</label>
    <div class="seg" id="np-kind">
      <button class="on" data-v="field"><i class="ph-fill ph-golf"></i> 필드 라운드</button>
      <button data-v="screen"><i class="ph-fill ph-monitor-play"></i> 스크린골프</button>
    </div>

    <label class="f-label" id="np-venue-label">골프장</label>
    <div class="f-input"><i class="ph ph-golf" style="color:var(--ink-3)"></i>
      <select id="np-course">${venueOpts("field")}</select></div>
    <button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="venuePickSheet()"><i class="ph-bold ph-magnifying-glass"></i>전국 ${(COURSES.length + DIRV.length).toLocaleString()}곳에서 검색</button>

    <label class="f-label">날짜 <span id="np-date-sel" style="font-weight:700;color:var(--green-2);margin-left:6px">오늘</span></label>
    <div class="cal" id="np-cal"></div>

    <label class="f-label">시작 시간 · 홀</label>
    <div style="display:flex;gap:8px">
      <div class="f-input" style="flex:1"><i class="ph ph-clock" style="color:var(--ink-3)"></i><input type="time" id="np-tee" value="07:30"></div>
      <div class="seg" id="np-holes">${[9, 18, 36].map(h => `<button class="${h === 18 ? "on" : ""}" data-v="${h}">${h}홀</button>`).join("")}</div>
    </div>

    <div id="np-hours-wrap" class="hidden">
      <label class="f-label">룸 이용 시간</label>
      <div class="seg" id="np-hours">${[1, 2, 3].map(h => `<button class="${h === 2 ? "on" : ""}" data-v="${h}">${h}시간</button>`).join("")}</div>
    </div>

    <label class="f-label">채워야 할 자리</label>
    <div class="seg" id="np-slots">${[1, 2, 3].map(n => `<button class="${n === 1 ? "on" : ""}" data-v="${n}">${n}명</button>`).join("")}</div>

    <label class="f-label">1인 비용</label>
    <div style="display:flex;gap:8px">
      <div style="flex:1"><div style="font-size:11px;font-weight:800;color:var(--ink-3);margin-bottom:5px">정상가</div>
        <div class="f-input"><input type="number" id="np-normal" value="280000" inputmode="numeric"></div></div>
      <div style="flex:1"><div style="font-size:11px;font-weight:800;color:var(--ink-3);margin-bottom:5px">참여가 (할인)</div>
        <div class="f-input" style="border-color:var(--green)"><input type="number" id="np-price" value="170000" inputmode="numeric"></div></div>
    </div>
    <div id="np-off" style="margin-top:10px;text-align:center;font-size:14px;font-weight:800;color:var(--green-2)">39% 할인이면 금방 채워질 거예요</div>

    <label class="f-label">정산 방식</label>
    <div class="seg" id="np-pay">
      <button class="on" data-v="onsite">현장결제</button>
      <button data-v="transfer">계좌이체로 받기</button>
    </div>
    <div id="np-pay-hint" class="hidden" style="margin-top:9px;font-size:12.5px;color:var(--ink-2);font-weight:600;background:var(--card);border:1.5px dashed var(--line);border-radius:14px;padding:12px 14px"></div>

    <label class="f-label">참여 조건</label>
    <div class="seg" id="np-level">${["누구나", "100타 이내", "90타 이내"].map(l => `<button class="${l === "누구나" ? "on" : ""}" data-v="${l}">${l}</button>`).join("")}</div>

    <label class="f-label">태그</label>
    <div class="seg" id="np-tags">${["초보환영", "빠른진행", "여성 환영", "노캐디", "야간 라운드", "조식 포함"].map(t => `<button data-v="${t}">${t}</button>`).join("")}</div>

    <label class="f-label">한마디 (취소 사유 등)</label>
    <div class="f-input"><textarea id="np-memo" rows="3" placeholder="예) 일행 한 명이 급한 일로 취소됐어요. 매너 좋은 분이면 누구나 환영!" style="resize:none;line-height:1.5"></textarea></div>

    <button class="btn btn-primary" id="np-go" style="margin-top:28px"><i class="ph-fill ph-megaphone"></i>모집 올리기</button>
  </div>`;

  const seg = (id, key, num) => $(id).addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$(id + " button").forEach(x => x.classList.remove("on")); b.classList.add("on");
    st[key] = num ? +b.dataset.v : b.dataset.v;
    if (key === "pay") {
      const hint = $("#np-pay-hint");
      if (st.pay === "transfer") {
        hint.classList.remove("hidden");
        hint.innerHTML = S.pay
          ? `정산 계좌: <b>${S.pay.bank} ${maskAcct(S.pay.num)} (${S.pay.holder})</b> 로 안내돼요.`
          : `등록된 정산 계좌가 없어요. <b onclick="location.hash='#/pay'" style="color:var(--green-2);text-decoration:underline">결제 수단에서 계좌를 등록</b>하면 참여자에게 자동 안내됩니다.`;
      } else hint.classList.add("hidden");
    }
  });
  seg("#np-holes", "holes", true); seg("#np-hours", "hours", true); seg("#np-slots", "slots", true); seg("#np-level", "level"); seg("#np-pay", "pay");

  /* 캘린더 (오늘부터 60일) */
  const today0 = new Date(BOOT.getFullYear(), BOOT.getMonth(), BOOT.getDate());
  const MAX_DAY = 60;
  let calView = new Date(BOOT.getFullYear(), BOOT.getMonth(), 1);
  const drawCal = () => {
    const y = calView.getFullYear(), m = calView.getMonth();
    const first = new Date(y, m, 1);
    const dim = new Date(y, m + 1, 0).getDate();
    const thisMonth = new Date(BOOT.getFullYear(), BOOT.getMonth(), 1);
    const lastMonth = new Date(today0.getTime() + MAX_DAY * 864e5);
    const canPrev = calView > thisMonth;
    const canNext = new Date(y, m + 1, 1) <= new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    let cells = "";
    for (let i = 0; i < first.getDay(); i++) cells += "<span></span>";
    for (let d = 1; d <= dim; d++) {
      const dt = new Date(y, m, d);
      const off = Math.round((dt - today0) / 864e5);
      const ok = off >= 0 && off <= MAX_DAY;
      const dow = dt.getDay();
      cells += `<button data-off="${off}" ${ok ? "" : "disabled"} class="${off === st.day ? "sel" : ""} ${dow === 0 ? "sun" : dow === 6 ? "cs-sat" : ""} ${off === 0 ? "today" : ""}">${d}</button>`;
    }
    $("#np-cal").innerHTML = `
      <div class="cal-head">
        <button id="cal-prev" ${canPrev ? "" : "disabled"}><i class="ph-bold ph-caret-left"></i></button>
        <b>${y}년 ${m + 1}월</b>
        <button id="cal-next" ${canNext ? "" : "disabled"}><i class="ph-bold ph-caret-right"></i></button>
      </div>
      <div class="cal-dow">${DOW.map((d, i) => `<span class="${i === 0 ? "sun" : i === 6 ? "cs-sat" : ""}">${d}</span>`).join("")}</div>
      <div class="cal-grid">${cells}</div>`;
    $("#cal-prev").addEventListener("click", () => { calView = new Date(y, m - 1, 1); drawCal(); });
    $("#cal-next").addEventListener("click", () => { calView = new Date(y, m + 1, 1); drawCal(); });
    $$("#np-cal .cal-grid button:not([disabled])").forEach(b => b.addEventListener("click", () => {
      st.day = +b.dataset.off;
      const dt = new Date(today0.getTime() + st.day * 864e5);
      $("#np-date-sel").textContent = st.day === 0 ? "오늘" : st.day === 1 ? "내일" : `${dt.getMonth() + 1}월 ${dt.getDate()}일 (${DOW[dt.getDay()]}) · ${st.day}일 후`;
      drawCal();
    }));
  };
  drawCal();
  $("#np-kind").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$("#np-kind button").forEach(x => x.classList.remove("on")); b.classList.add("on");
    st.kind = b.dataset.v;
    const scr = st.kind === "screen";
    $("#np-course").innerHTML = venueOpts(st.kind);
    $("#np-venue-label").textContent = scr ? "스크린골프 매장" : "골프장";
    $("#np-hours-wrap").classList.toggle("hidden", !scr);
    $("#np-tee").value = scr ? "20:00" : "07:30";
    $("#np-normal").value = scr ? 30000 : 280000;
    $("#np-price").value = scr ? 13000 : 170000;
    $("#np-normal").dispatchEvent(new Event("input"));
  });
  $("#np-tags").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    b.classList.toggle("on");
    const v = b.dataset.v;
    st.tags = st.tags.includes(v) ? st.tags.filter(x => x !== v) : [...st.tags, v];
  });
  const offCalc = () => {
    st.normal = +$("#np-normal").value || 0; st.price = +$("#np-price").value || 0;
    const off = st.normal > 0 ? Math.round((1 - st.price / st.normal) * 100) : 0;
    const el = $("#np-off");
    if (off >= 30) { el.style.color = "var(--green-2)"; el.textContent = `${off}% 할인이면 금방 채워질 거예요`; }
    else if (off > 0) { el.style.color = "var(--amber)"; el.textContent = `${off}% 할인. 30% 이상이면 평균 30분 내 매칭돼요`; }
    else { el.style.color = "var(--red)"; el.textContent = "참여가는 정상가보다 낮아야 해요"; }
  };
  $("#np-normal").addEventListener("input", offCalc);
  $("#np-price").addEventListener("input", offCalc);

  /* 전국 검색으로 골프장 선택 → select에 옵션 주입 */
  window.venuePickSheet = () => {
    const scr = st.kind === "screen";
    const pool = allVenues().filter(v => (scr ? v.scr : !v.scr && !v.rng));
    const rowsOf = q => {
      const qq = (q || "").trim().toLowerCase();
      return pool.filter(v => !qq || v.name.toLowerCase().includes(qq)).slice(0, 30)
        .map(v => `<div class="s-row" onclick="pickVenue('${v.id}','${v.name.replace(/'/g, "")}')">
          <span class="s-ic ${v.scr ? "scr" : ""}"><i class="ph-fill ${v.scr ? "ph-monitor-play" : "ph-golf"}"></i></span>
          <div style="flex:1;min-width:0"><b>${v.name}</b><div class="s-sub">${v.region}${v.city && v.city !== v.region ? " · " + v.city : ""}</div></div>
        </div>`).join("") || '<div class="empty" style="padding:26px"><b>검색 결과가 없어요</b></div>';
    };
    openSheet(`
      <div style="font-size:17px;font-weight:900;margin-bottom:12px">${scr ? "스크린 매장" : "골프장"} 검색</div>
      <div class="f-input"><i class="ph-bold ph-magnifying-glass" style="color:var(--ink-3)"></i><input id="vp-q" placeholder="이름으로 검색"></div>
      <div id="vp-list" style="margin-top:12px;max-height:46dvh;overflow-y:auto">${rowsOf("")}</div>
    `);
    $("#vp-q").addEventListener("input", e => { $("#vp-list").innerHTML = rowsOf(e.target.value); });
  };
  window.pickVenue = (id, name) => {
    const sel = $("#np-course");
    if (![...sel.options].some(o => o.value === id)) {
      const o = document.createElement("option");
      o.value = id; o.textContent = name;
      sel.appendChild(o);
    }
    sel.value = id;
    closeSheet();
    toast(name + " 선택됨");
  };
  $("#np-go").addEventListener("click", () => {
    st.courseId = $("#np-course").value;
    st.tee = $("#np-tee").value || "07:30";
    st.memo = $("#np-memo").value.trim() || "매너 좋은 분이면 누구나 환영합니다!";
    offCalc();
    if (st.price <= 0 || st.price >= st.normal) { toast("참여가를 확인해주세요", "warning"); return; }
    const post = {
      id: "mp" + Date.now(), courseId: st.courseId, hostId: "me", day: st.day, tee: st.tee,
      holes: st.holes, total: 4, joiners: ["me"], normal: st.normal, price: st.price,
      reason: "일행 취소", instant: true, level: st.level, tags: st.tags.length ? st.tags : ["매너중시"],
      genderPref: "무관", memo: st.memo, ago: "방금 전", pay: st.pay,
    };
    if (st.kind === "screen") post.hours = st.hours;
    S.myPosts.push(post);
    Store.save();
    toast("모집이 올라갔어요! 신청이 오면 알려드릴게요");
    location.hash = "#/post/" + post.id;
  });
}

/* ── 크루 ─────────────────────────────── */
function crewCard(cr) {
  const joined = S.crews.includes(cr.id);
  return `
  <div class="crew-card in" onclick="location.hash='#/crew/${cr.id}'">
    <div class="crew-cover" style="background:${cr.cover}"><i class="ph-fill ${cr.icon}"></i></div>
    <div class="crew-body">
      <div class="crew-name">${cr.name} ${joined ? '<span class="tag green" style="font-size:10px">가입됨</span>' : ""}</div>
      <div class="crew-desc">${cr.desc}</div>
      <div class="crew-meta">
        <span class="tag"><i class="ph-fill ph-users"></i>${cr.members.toLocaleString()}명</span>
        <span class="tag">${cr.region}</span>
        <span class="tag lime">${cr.schedule}</span>
      </div>
    </div>
  </div>`;
}
function renderCrews() {
  appEl.innerHTML = `
  <div class="view">
    <div class="page-head"><h1>골프 크루</h1></div>
    <p class="px" style="font-size:13.5px;color:var(--ink-2);font-weight:500;line-height:1.6;margin-bottom:16px">라운드에서 만난 사이가 크루가 됩니다. 정기 라운드, 번개, 원정까지. 혼자 치는 골프는 이제 그만.</p>
    <div class="px">${CREWS.map(crewCard).join("")}</div>
    <div class="px" style="margin-top:8px">
      <div class="partner-card in"><div class="ic"><i class="ph-fill ph-flag-banner"></i></div><b>나만의 크루 만들기</b><p>정기 멤버가 4명 이상이면 크루를 개설할 수 있어요.<br>크루 전용 모집과 단체 할인이 제공됩니다.</p>
      <button class="btn btn-ghost btn-sm" style="margin:14px auto 0" onclick="toast('크루 개설은 곧 열려요! 조금만 기다려주세요','sparkle')">개설 신청</button></div>
    </div>
  </div>`;
  stagger();
}
function renderCrew(id) {
  const cr = CREWS.find(x => x.id === id);
  if (!cr) { location.hash = "#/crew"; return; }
  const joined = S.crews.includes(id);
  const extra = (S.crewFeed[id] || []);
  const feed = [...extra, ...cr.feed];
  appEl.innerHTML = `
  <div class="view" style="padding-bottom:40px">
    <button class="d-back" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button>
    <div class="detail-hero" style="height:190px;background:${cr.cover};display:flex;align-items:center;justify-content:center;font-size:72px;color:#fff"><i class="ph-fill ${cr.icon}"></i></div>
    <div class="float-hero-off">
      <div class="d-card in">
        <div style="font-size:21px;font-weight:900">${cr.name}</div>
        <div style="margin-top:6px;font-size:13.5px;color:var(--ink-2);font-weight:500;line-height:1.6">${cr.desc}</div>
        <div class="crew-meta" style="margin-top:12px">
          <span class="tag"><i class="ph-fill ph-users"></i>${(cr.members + (joined ? 1 : 0)).toLocaleString()}명</span>
          <span class="tag">${cr.region}</span><span class="tag lime">${cr.schedule}</span>
          ${cr.tags.map(t => `<span class="tag">${t}</span>`).join("")}
        </div>
        <button class="btn ${joined ? "btn-ghost" : "btn-primary"}" style="margin-top:16px" onclick="toggleCrew('${cr.id}')">${joined ? "가입됨 · 나가기" : "크루 가입하기"}</button>
      </div>
      <div class="d-card in">
        <h3><i class="ph-fill ph-chats-circle"></i>크루 피드</h3>
        ${joined ? `<div class="f-input" style="margin-bottom:10px"><input id="crew-msg" maxlength="120" placeholder="크루에게 한마디 남기기"><button style="color:var(--green-2);font-size:20px" onclick="crewPost('${cr.id}')"><i class="ph-fill ph-paper-plane-tilt"></i></button></div>` : ""}
        ${feed.map((f, i) => `
          <div class="feed-item">
            ${avat(f)}
            <div style="flex:1">
              <span class="fi-name">${f.name}</span><span class="fi-when">${f.when}</span>
              <div class="fi-text">${f.text}</div>
              <button class="fi-like ${S.likes.includes(id + i) ? "on" : ""}" onclick="likeFeed('${id}',${i},this)"><i class="ph-fill ph-heart"></i><span>${f.likes + (S.likes.includes(id + i) ? 1 : 0)}</span></button>
            </div>
          </div>`).join("")}
      </div>
    </div>
  </div>`;
  stagger();
}
window.toggleCrew = id => {
  if (!S.user) { toast("크루 가입엔 프로필이 필요해요", "user-circle-plus"); location.hash = "#/signup"; return; }
  const i = S.crews.indexOf(id);
  if (i >= 0) { S.crews.splice(i, 1); toast("크루에서 나왔어요"); }
  else { S.crews.push(id); toast("크루 가입 완료! 피드에 인사를 남겨보세요"); }
  Store.save();
  renderCrew(id);
};
window.crewPost = id => {
  const inp = $("#crew-msg");
  const text = inp.value.trim();
  if (!text) return;
  if (!S.crewFeed[id]) S.crewFeed[id] = [];
  S.crewFeed[id].unshift({ name: S.user.nick, avatar: S.user.avatar, g: S.user.g, text, when: "방금 전", likes: 0 });
  Store.save();
  renderCrew(id);
  toast("피드에 올라갔어요");
};
window.likeFeed = (id, i, btn) => {
  event.stopPropagation();
  const key = id + i;
  const on = S.likes.includes(key);
  if (on) S.likes = S.likes.filter(k => k !== key); else S.likes.push(key);
  Store.save();
  btn.classList.toggle("on", !on);
  const n = btn.querySelector("span");
  n.textContent = +n.textContent + (on ? -1 : 1);
};

/* ── 채팅 ─────────────────────────────── */
function renderChatList() {
  const hids = Object.keys(S.chats).sort((a, b) => {
    const la = chatMsgs(a).slice(-1)[0], lb = chatMsgs(b).slice(-1)[0];
    return (lb ? 1 : 0) - (la ? 1 : 0);
  });
  appEl.innerHTML = `
  <div class="view">
    <div class="page-head"><button class="back" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button><h1>메시지</h1></div>
    <div class="px" style="margin-top:8px">
      ${hids.length ? hids.map(hid => {
        const h = hostById(hid);
        if (!h) return "";
        const msgs = chatMsgs(hid);
        const last = msgs[msgs.length - 1];
        const un = unreadOf(hid);
        return `<div class="chat-row in" onclick="location.hash='#/chat/${hid}'">
          ${avat(h)}
          <div><div class="cr-name">${h.name}</div><div class="cr-last">${last ? last.t : ""}</div></div>
          <div class="cr-meta"><div class="cr-when">${last ? last.w : ""}</div>${un ? `<div class="cr-unread">${un}</div>` : ""}</div>
        </div>`;
      }).join("") : `
      <div class="empty" style="padding-top:90px"><div class="big"><i class="ph ph-chat-circle-dots"></i></div>
        <b>아직 메시지가 없어요</b><p>모집 글에서 호스트에게 메시지를 보내<br>티오프 전에 미리 인사를 나눠보세요.</p>
        <button class="btn btn-lime btn-sm" style="margin:16px auto 0" onclick="location.hash='#/home'">모집 보러가기</button>
      </div>`}
    </div>
  </div>`;
  stagger();
}
function renderThread(hid) {
  const h = hostById(hid);
  if (!h) { location.hash = "#/chat"; return; }
  const msgs = chatMsgs(hid);
  S.readAt[hid] = msgs.length;
  Store.save();
  appEl.innerHTML = `
  <div class="view thread">
    <div class="thread-head">
      <button class="back" style="width:36px;height:36px;border-radius:12px;background:var(--card);box-shadow:var(--shadow-sm);display:flex;align-items:center;justify-content:center;flex:none" onclick="location.hash='#/chat'"><i class="ph-bold ph-arrow-left"></i></button>
      ${avat(h)}
      <div style="flex:1;min-width:0"><div class="th-name">${h.name}</div><div class="th-sub">그린지수 ${h.temp.toFixed(1)} · ${h.career} · 보통 10분 내 응답</div></div>
      <button style="font-size:20px;color:var(--ink-3)" onclick="location.hash='#/user/${hid}'"><i class="ph ph-user-circle"></i></button>
    </div>
    <div class="msgs" id="msgs">
      <div style="text-align:center;font-size:11.5px;color:var(--ink-3);font-weight:600;padding:4px 0 8px">호스트와의 대화입니다. 연락처 공유 전 상대 프로필과 그린지수를 확인하세요.</div>
      ${msgs.map(m => `<div class="msg ${m.f === "me" ? "me" : "them"}">${m.t}<span class="mw">${m.w}</span></div>`).join("")}
      ${pendingReply[hid] ? '<div class="typing"><span></span><span></span><span></span></div>' : ""}
    </div>
    <div class="chat-chips">${DM_CHIPS.map(t => `<button class="chip" onclick="sendChip('${hid}',this)">${t}</button>`).join("")}</div>
  </div>
  <div class="chat-input">
    <div class="f-input"><input id="chat-inp" maxlength="200" placeholder="메시지 보내기" onkeydown="if(event.key==='Enter')sendMsg('${hid}')"></div>
    <button class="chat-send" onclick="sendMsg('${hid}')"><i class="ph-fill ph-paper-plane-tilt"></i></button>
  </div>`;
  const box = $("#msgs");
  window.scrollTo(0, document.body.scrollHeight);
}
window.sendMsg = hid => {
  const inp = $("#chat-inp");
  const t = (inp.value || "").trim();
  if (!t) return;
  pushMsg(hid, "me", t);
  inp.value = "";
  scheduleReply(hid);
};
window.sendChip = (hid, btn) => {
  pushMsg(hid, "me", btn.textContent);
  scheduleReply(hid);
};

/* ── 프로필 (나) ────────────────────────── */
function badgeIcon(t) {
  if (t.includes("시간")) return "ph-clock";
  if (t.includes("버디")) return "ph-star";
  if (t.includes("매너")) return "ph-heart";
  if (t.includes("싱글")) return "ph-trophy";
  if (t.includes("새벽")) return "ph-sun-horizon";
  if (t.includes("여성")) return "ph-flower";
  if (t.includes("새싹")) return "ph-plant";
  if (t.includes("인증")) return "ph-seal-check";
  if (t.includes("크루")) return "ph-users-three";
  return "ph-medal";
}
function renderMe() {
  if (!S.user) {
    appEl.innerHTML = `
    <div class="view"><div class="empty" style="padding-top:110px">
      <div class="big"><i class="ph ph-user-circle-plus"></i></div><b>아직 프로필이 없어요</b>
      <p>프로필을 만들면 참여 신청, 모집 올리기,<br>그린지수 관리까지 전부 열려요.</p>
      <button class="btn btn-primary" style="margin-top:22px;max-width:260px;margin-left:auto;margin-right:auto" onclick="location.hash='#/signup'">1분 만에 프로필 만들기</button>
    </div></div>`;
    return;
  }
  const u = S.user;
  const upcoming = S.joined.map(postById).filter(Boolean).filter(p => teeDate(p) > new Date(Date.now() - 6 * 3600e3)).sort((a, b) => teeDate(a) - teeDate(b));
  const myPosts = S.myPosts.filter(p => !S.closed.includes(p.id));
  const saved = S.joined.map(postById).filter(Boolean).reduce((s, p) => s + (p.normal - p.price), 0);
  const unread = unreadTotal();
  appEl.innerHTML = `
  <div class="view">
    <div class="prof-hero">
      <div class="prof-av av g${u.g}"><svg viewBox="0 0 24 24">${AV_GLYPHS[u.avatar % AV_GLYPHS.length]}</svg></div>
      <div class="prof-name">${u.nick}</div>
      <div class="prof-sub">${u.career} · 평균 ${u.avg}타 · ${u.region}</div>
      ${u.verified ? '<span class="verified"><i class="ph-fill ph-seal-check"></i>본인인증 완료</span>' : ""}
    </div>
    <div class="stat-row in">
      <div class="stat-cell"><b>${S.joined.length}</b><span>참여 라운드</span></div>
      <div class="stat-cell"><b>5.0</b><span>그린지수</span></div>
      <div class="stat-cell"><b>${saved > 0 ? won(saved) : "₩0"}</b><span>총 절약</span></div>
    </div>

    <div class="h-sec px"><h2>내 뱃지</h2></div>
    <div class="px"><div class="badge-scroll in">
      <span class="badge-pill"><i class="ph-fill ph-plant"></i>라스트티 새싹</span>
      ${u.verified ? '<span class="badge-pill"><i class="ph-fill ph-seal-check"></i>본인인증</span>' : ""}
      ${S.joined.length > 0 ? '<span class="badge-pill"><i class="ph-fill ph-golf"></i>첫 참여 완료</span>' : ""}
      ${S.crews.length > 0 ? '<span class="badge-pill"><i class="ph-fill ph-users-three"></i>크루 멤버</span>' : ""}
      ${(u.styles || []).map(s => `<span class="badge-pill"><i class="ph-fill ph-tag"></i>${s}</span>`).join("")}
    </div></div>

    <div class="h-sec px"><h2>예정된 라운드</h2></div>
    <div class="px">
      ${upcoming.length ? upcoming.map(p => { const c = courseById(p.courseId); const d = teeDate(p); return `
        <div class="hist-card in" onclick="location.hash='#/post/${p.id}'">
          <div class="hist-date"><b>${d.getDate()}</b><span>${d.getMonth() + 1}월 ${DOW[d.getDay()]}</span></div>
          <div style="flex:1"><b style="font-size:15px">${c.name}</b>
            <div style="font-size:12px;color:var(--ink-3);font-weight:600;margin-top:3px">${teeStr(p)} 티오프 · ${p.holes}홀 · ${won(p.price)}</div></div>
          <span class="tag green">확정</span>
        </div>`; }).join("")
        : `<div class="empty" style="padding:30px"><b>아직 예정된 라운드가 없어요</b><p>지금 열린 모집을 둘러보세요!</p><button class="btn btn-lime btn-sm" style="margin:14px auto 0" onclick="location.hash='#/home'">빈자리 보러가기</button></div>`}
    </div>

    ${myPosts.length ? `
    <div class="h-sec px"><h2>내가 올린 모집</h2></div>
    <div class="px">${myPosts.map(postCard).join("")}</div>` : ""}

    ${S.subJoined.length ? `
    <div class="h-sec px"><h2>이용 중인 연습장 구독</h2></div>
    <div class="px">${S.subJoined.map(id => SUBS.find(s => s.id === id)).filter(Boolean).map(subCard).join("")}</div>` : ""}

    <div class="h-sec px"><h2>받은 후기</h2></div>
    <div class="px"><div class="d-card in" style="margin:0">
      <div class="empty" style="padding:16px"><b>첫 라운드 후 후기가 쌓여요</b><p>라운드가 끝나면 동반자들이 서로 그린지수와<br>후기를 남겨 신뢰를 쌓아갑니다.</p></div>
    </div></div>

    <div class="mg-title px">바로가기</div>
    <div class="px"><div class="menu-group in">
      <button class="menu-row" onclick="location.hash='#/chat'"><i class="ph-fill ph-chat-circle-dots"></i>메시지함${unread ? `<span class="cr-unread" style="margin-left:8px">${unread}</span>` : ""}<i class="ph-bold ph-caret-right chev"></i></button>
      <button class="menu-row" onclick="location.hash='#/pay'"><i class="ph-fill ph-bank"></i>결제 수단<span class="mr-val">${S.pay ? S.pay.bank + " " + maskAcct(S.pay.num) : "계좌 미등록"}</span><i class="ph-bold ph-caret-right chev"></i></button>
      <button class="menu-row" onclick="location.hash='#/settings'"><i class="ph-fill ph-gear-six"></i>설정<i class="ph-bold ph-caret-right chev"></i></button>
    </div></div>
  </div>`;
  stagger();
}

/* ── 호스트 프로필 ─────────────────────── */
function renderUser(id) {
  const h = hostById(id);
  if (!h) { location.hash = "#/home"; return; }
  const their = openPosts().filter(p => p.hostId === id);
  appEl.innerHTML = `
  <div class="view">
    <button class="d-back" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button>
    <div class="prof-hero">
      <div class="prof-av av g${h.g}"><svg viewBox="0 0 24 24">${AV_GLYPHS[h.avatar % AV_GLYPHS.length]}</svg></div>
      <div class="prof-name">${h.name}</div>
      <div class="prof-sub">${h.gender} · ${h.age} · ${h.career} · 평균 ${h.avg}타</div>
      ${h.verified ? '<span class="verified"><i class="ph-fill ph-seal-check"></i>본인인증 완료</span>' : ""}
    </div>
    <div class="stat-row in">
      <div class="stat-cell"><b>${h.rounds}</b><span>총 라운드</span></div>
      <div class="stat-cell"><b>${h.temp.toFixed(1)}</b><span>그린지수</span></div>
      <div class="stat-cell"><b>${h.reviews.length * 9 + 4}</b><span>받은 후기</span></div>
    </div>
    <div class="px" style="margin-top:18px"><div class="d-card in" style="margin:0">
      <p style="font-size:14.5px;font-weight:600;line-height:1.6;color:var(--ink-2)">"${h.intro}"</p>
      <button class="btn btn-primary btn-sm" style="margin-top:14px" onclick="openChat('${h.id}')"><i class="ph-fill ph-chat-circle-dots"></i>메시지 보내기</button>
    </div></div>
    <div class="h-sec px"><h2>뱃지</h2></div>
    <div class="px"><div class="badge-scroll in">${h.badges.map(b => `<span class="badge-pill"><i class="ph-fill ${badgeIcon(b)}"></i>${b}</span>`).join("")}</div></div>
    ${their.length ? `
    <div class="h-sec px"><h2>${h.name}님의 모집</h2></div>
    <div class="px">${their.map(postCard).join("")}</div>` : ""}
    <div class="h-sec px"><h2>동반자 후기</h2></div>
    <div class="px"><div class="d-card in" style="margin:0">
      ${h.reviews.map(r => `<div class="review-card">
        <div class="rv-top"><span class="stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</span><span class="when">${r.from} · ${r.when}</span></div>
        <div class="rv-text">${r.text}</div>
      </div>`).join("")}
    </div></div>
    <div style="height:24px"></div>
  </div>`;
  stagger();
}

/* ── 알림 ─────────────────────────────── */
function renderAlerts() {
  appEl.innerHTML = `
  <div class="view">
    <div class="page-head"><button class="back" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button><h1>알림</h1></div>
    <div class="px" style="margin-top:8px">
      ${NOTIFS.map(n => `<div class="notif-row in"><div class="ic"><i class="ph-fill ${n.icon}"></i></div><div><b>${n.title}</b><p>${n.body}</p><span>${n.when}</span></div></div>`).join("")}
    </div>
  </div>`;
  stagger();
}

/* ── 결제 수단 ─────────────────────────── */
function maskAcct(num) {
  const d = (num || "").replace(/\D/g, "");
  return d.length > 4 ? "****" + d.slice(-4) : d;
}
function renderPay() {
  if (!S.user) { toast("프로필이 필요해요", "user-circle-plus"); location.hash = "#/signup"; return; }
  appEl.innerHTML = `
  <div class="view form-page" style="padding-top:18px">
    <div style="display:flex;align-items:center;gap:12px">
      <button style="width:38px;height:38px;border-radius:13px;background:var(--card);box-shadow:var(--shadow-sm);display:flex;align-items:center;justify-content:center" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button>
      <h1 style="margin:0;font-size:22px">결제 수단</h1>
    </div>

    <div class="mg-title" style="margin-top:24px">기본 결제 방식</div>
    <div class="radio-row ${S.payPref === "onsite" ? "on" : ""}" onclick="setPayPref('onsite')">
      <span class="rd"></span>
      <div><b>현장결제</b><p>골프장 프론트에서 각자 결제</p></div>
      <i class="ph-fill ph-storefront" style="margin-left:auto;font-size:22px;color:var(--ink-3)"></i>
    </div>
    <div class="radio-row ${S.payPref === "transfer" ? "on" : ""}" onclick="setPayPref('transfer')">
      <span class="rd"></span>
      <div><b>계좌이체</b><p>1/N 정산을 계좌이체로 주고받기</p></div>
      <i class="ph-fill ph-bank" style="margin-left:auto;font-size:22px;color:var(--ink-3)"></i>
    </div>

    <div class="mg-title" style="margin-top:26px">내 정산 계좌 (호스트용)</div>
    ${S.pay ? `
    <div class="pay-card">
      <div class="pay-bank"><i class="ph-fill ph-bank"></i> ${S.pay.bank}</div>
      <div class="pay-num">${maskAcct(S.pay.num)}</div>
      <div class="pay-holder">예금주 ${S.pay.holder} · 모집 확정 시 참여자에게 자동 안내</div>
    </div>
    <button class="btn btn-danger btn-sm" onclick="delPayAcct()">계좌 삭제</button>
    ` : `
    <p style="font-size:13px;color:var(--ink-2);font-weight:500;line-height:1.6;margin-bottom:14px">내가 모집을 올렸을 때 참여자에게 안내될 정산 계좌예요. 기기에만 저장되고 서버로 전송되지 않아요.</p>
    <label class="f-label">은행</label>
    <div class="f-input"><i class="ph ph-bank" style="color:var(--ink-3)"></i>
      <select id="pay-bank">${BANKS.map(b => `<option>${b}</option>`).join("")}</select></div>
    <label class="f-label">계좌번호</label>
    <div class="f-input"><input id="pay-num" inputmode="numeric" placeholder="숫자만 입력"></div>
    <label class="f-label">예금주</label>
    <div class="f-input"><input id="pay-holder" maxlength="10" placeholder="예금주 이름" value="${S.user.nick}"></div>
    <button class="btn btn-primary" style="margin-top:22px" onclick="savePayAcct()"><i class="ph-fill ph-bank"></i>계좌 등록하기</button>
    `}

    <div class="mg-title" style="margin-top:26px">준비 중</div>
    <div class="menu-group">
      <div class="menu-row" style="opacity:.5"><i class="ph-fill ph-credit-card"></i>카드 간편결제<span class="mr-val">준비 중</span></div>
      <div class="menu-row" style="opacity:.5"><i class="ph-fill ph-device-mobile"></i>토스페이 · 카카오페이<span class="mr-val">준비 중</span></div>
    </div>
  </div>`;
}
window.setPayPref = v => { S.payPref = v; Store.save(); renderPay(); };
window.savePayAcct = () => {
  const num = ($("#pay-num").value || "").replace(/\D/g, "");
  const holder = ($("#pay-holder").value || "").trim();
  if (num.length < 8) { toast("계좌번호를 확인해주세요", "warning"); return; }
  if (!holder) { toast("예금주를 입력해주세요", "warning"); return; }
  S.pay = { bank: $("#pay-bank").value, num, holder };
  Store.save();
  toast("정산 계좌가 등록됐어요", "bank");
  renderPay();
};
window.delPayAcct = () => { S.pay = null; Store.save(); toast("계좌가 삭제됐어요"); renderPay(); };

/* ── 설정 ─────────────────────────────── */
function tglRow(icon, label, key) {
  return `<div class="menu-row"><i class="ph-fill ${icon}"></i>${label}<button class="tgl ${S.set[key] ? "on" : ""}" onclick="tglSet('${key}',this)"></button></div>`;
}
window.tglSet = (key, el) => {
  S.set[key] = !S.set[key];
  Store.save();
  el.classList.toggle("on", S.set[key]);
  if (key === "dark") applyTheme();
};
function renderSettings() {
  appEl.innerHTML = `
  <div class="view form-page" style="padding-top:18px">
    <div style="display:flex;align-items:center;gap:12px">
      <button style="width:38px;height:38px;border-radius:13px;background:var(--card);box-shadow:var(--shadow-sm);display:flex;align-items:center;justify-content:center" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button>
      <h1 style="margin:0;font-size:22px">설정</h1>
    </div>

    <div class="mg-title" style="margin-top:24px">계정</div>
    <div class="menu-group">
      <button class="menu-row" onclick="location.hash='#/signup'"><i class="ph-fill ph-user-gear"></i>프로필 수정<i class="ph-bold ph-caret-right chev"></i></button>
      <button class="menu-row" onclick="${S.user && S.user.verified ? `toast('이미 본인인증이 완료됐어요','seal-check')` : `location.hash='#/signup'`}"><i class="ph-fill ph-seal-check"></i>본인인증<span class="mr-val">${S.user && S.user.verified ? "완료" : "미인증"}</span><i class="ph-bold ph-caret-right chev"></i></button>
      <button class="menu-row" onclick="location.hash='#/pay'"><i class="ph-fill ph-bank"></i>결제 수단<span class="mr-val">${S.pay ? S.pay.bank + " " + maskAcct(S.pay.num) : "계좌 미등록"}</span><i class="ph-bold ph-caret-right chev"></i></button>
      <button class="menu-row" onclick="couponSheet()"><i class="ph-fill ph-ticket"></i>쿠폰함<span class="mr-val">1장</span><i class="ph-bold ph-caret-right chev"></i></button>
    </div>

    <div class="mg-title">알림</div>
    <div class="menu-group">
      ${tglRow("ph-golf", "참여 확정 · 신청 알림", "nJoin")}
      ${tglRow("ph-timer", "마감 임박 빈자리 알림", "nHot")}
      ${tglRow("ph-users-three", "크루 새 글 알림", "nCrew")}
      ${tglRow("ph-megaphone", "이벤트 · 혜택 소식", "nMkt")}
    </div>

    <div class="mg-title">화면</div>
    <div class="menu-group">
      ${tglRow("ph-moon", "다크 모드", "dark")}
      <button class="menu-row" onclick="installSheet()"><i class="ph-fill ph-device-mobile"></i>홈 화면에 앱 설치<i class="ph-bold ph-caret-right chev"></i></button>
      <button class="menu-row" onclick="refreshApp()"><i class="ph-fill ph-arrows-clockwise"></i>최신 버전으로 새로고침<i class="ph-bold ph-caret-right chev"></i></button>
    </div>

    <div class="mg-title">지원</div>
    <div class="menu-group">
      <button class="menu-row" onclick="noticeSheet()"><i class="ph-fill ph-megaphone-simple"></i>공지사항<i class="ph-bold ph-caret-right chev"></i></button>
      <button class="menu-row" onclick="faqSheet()"><i class="ph-fill ph-question"></i>자주 묻는 질문<i class="ph-bold ph-caret-right chev"></i></button>
      <button class="menu-row" onclick="supportSheet()"><i class="ph-fill ph-headset"></i>고객센터<i class="ph-bold ph-caret-right chev"></i></button>
      <button class="menu-row" onclick="toast('제휴 문의가 접수됐어요. 곧 연락드릴게요!','handshake')"><i class="ph-fill ph-handshake"></i>골프장 제휴 문의<i class="ph-bold ph-caret-right chev"></i></button>
      <button class="menu-row" onclick="inviteFriend()"><i class="ph-fill ph-gift"></i>친구 초대<span class="mr-val">서로 1만원 쿠폰</span><i class="ph-bold ph-caret-right chev"></i></button>
    </div>

    <div class="mg-title">약관 · 정보</div>
    <div class="menu-group">
      <button class="menu-row" onclick="docSheet('이용약관')"><i class="ph-fill ph-file-text"></i>이용약관<i class="ph-bold ph-caret-right chev"></i></button>
      <button class="menu-row" onclick="docSheet('개인정보 처리방침')"><i class="ph-fill ph-lock-key"></i>개인정보 처리방침<i class="ph-bold ph-caret-right chev"></i></button>
      <button class="menu-row" onclick="toast('현재 최신 버전이에요','check-circle')"><i class="ph-fill ph-info"></i>버전<span class="mr-val">v${VERSION}</span></button>
    </div>

    <div class="mg-title">기타</div>
    <div class="menu-group">
      <button class="menu-row" style="color:var(--red)" onclick="resetAll()"><i class="ph-fill ph-sign-out" style="color:var(--red)"></i>로그아웃 (데이터 초기화)<i class="ph-bold ph-caret-right chev"></i></button>
    </div>
  </div>`;
}
window.couponSheet = () => openSheet(`
  <div style="text-align:center"><div class="sheet-ic"><i class="ph-fill ph-ticket"></i></div>
  <div style="font-size:19px;font-weight:900;margin-top:12px">내 쿠폰함</div></div>
  <div class="pay-card" style="margin-top:18px">
    <div class="pay-bank"><i class="ph-fill ph-gift"></i> 웰컴 쿠폰</div>
    <div class="pay-num">10,000원 할인</div>
    <div class="pay-holder">첫 참여 확정 시 자동 적용 · 유효기간 30일</div>
  </div>
  <button class="btn btn-ghost" onclick="closeSheet()">닫기</button>`);
window.noticeSheet = () => openSheet(`
  <div style="font-size:18px;font-weight:900;margin-bottom:14px">공지사항</div>
  ${NOTICES.map(n => `<div class="review-card"><div class="rv-top"><span>${n.title}</span><span class="when">${n.when}</span></div><div class="rv-text">${n.body}</div></div>`).join("")}
  <button class="btn btn-ghost" style="margin-top:10px" onclick="closeSheet()">닫기</button>`);
window.faqSheet = () => openSheet(`
  <div style="font-size:18px;font-weight:900;margin-bottom:6px">자주 묻는 질문</div>
  ${FAQS.map(f => `<div class="faq-item"><button class="faq-q" onclick="this.parentElement.classList.toggle('open')">${f.q}<i class="ph-bold ph-caret-down"></i></button><div class="faq-a"><div>${f.a}</div></div></div>`).join("")}
  <button class="btn btn-ghost" style="margin-top:14px" onclick="closeSheet()">닫기</button>`);
window.supportSheet = () => openSheet(`
  <div style="text-align:center"><div class="sheet-ic"><i class="ph-fill ph-headset"></i></div>
  <div style="font-size:19px;font-weight:900;margin-top:12px">고객센터</div>
  <p style="font-size:13px;color:var(--ink-2);font-weight:500;margin-top:6px;line-height:1.6">평일 오전 9시부터 오후 6시까지 운영해요.</p></div>
  <div class="menu-group" style="margin-top:16px;box-shadow:none;border:1.5px solid var(--line)">
    <button class="menu-row" onclick="toast('카카오톡 채널로 연결돼요 (준비 중)','chat-circle-dots')"><i class="ph-fill ph-chat-circle-dots"></i>카카오톡 문의<i class="ph-bold ph-caret-right chev"></i></button>
    <button class="menu-row" onclick="location.href='mailto:help@lasttee.kr'"><i class="ph-fill ph-envelope-simple"></i>이메일 문의<span class="mr-val">help@lasttee.kr</span></button>
  </div>
  <button class="btn btn-ghost" style="margin-top:10px" onclick="closeSheet()">닫기</button>`);
window.docSheet = title => openSheet(`
  <div style="font-size:18px;font-weight:900;margin-bottom:12px">${title}</div>
  <p style="font-size:13.5px;line-height:1.75;color:var(--ink-2);font-weight:500">${title === "이용약관" ? TERMS_TEXT : PRIVACY_TEXT}</p>
  <button class="btn btn-ghost" style="margin-top:16px" onclick="closeSheet()">확인했어요</button>`);
window.inviteFriend = () => {
  const text = "라스트티에서 취소된 골프 티타임을 반값에 잡아보세요! " + location.origin + location.pathname;
  if (navigator.share) navigator.share({ title: "라스트티 초대", text }).catch(() => {});
  else { navigator.clipboard?.writeText(text); toast("초대 링크가 복사됐어요", "gift"); }
};
window.refreshApp = async () => {
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.update()));
  }
  location.reload();
};
window.installSheet = () => {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  openSheet(`
  <div style="text-align:center"><div class="sheet-ic"><i class="ph-fill ph-device-mobile"></i></div>
  <div style="font-size:19px;font-weight:900;margin-top:12px">앱으로 설치하기</div>
  <p style="font-size:13px;color:var(--ink-2);font-weight:500;margin-top:6px">홈 화면에 추가하면 앱처럼 전체 화면으로 열려요.</p></div>
  <div style="margin-top:16px">
    ${ios ? `
    <div class="info-step"><span class="n">1</span><p>사파리 하단의 <b>공유 버튼</b>을 눌러주세요.</p></div>
    <div class="info-step"><span class="n">2</span><p>목록에서 <b>홈 화면에 추가</b>를 선택해요.</p></div>
    <div class="info-step"><span class="n">3</span><p>오른쪽 위 <b>추가</b>를 누르면 끝!</p></div>
    ` : `
    <div class="info-step"><span class="n">1</span><p>브라우저 메뉴(점 3개)를 열어주세요.</p></div>
    <div class="info-step"><span class="n">2</span><p><b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 선택해요.</p></div>
    <div class="info-step"><span class="n">3</span><p><b>설치</b>를 누르면 끝!</p></div>
    `}
  </div>
  <button class="btn btn-ghost" style="margin-top:16px" onclick="closeSheet()">닫기</button>`);
};
window.resetAll = () => {
  openSheet(`
    <div style="text-align:center;padding:6px 0 2px">
      <div class="sheet-ic" style="background:#FDEBEC;color:var(--red)"><i class="ph-fill ph-sign-out"></i></div>
      <div style="font-size:19px;font-weight:900;margin-top:12px">로그아웃할까요?</div>
      <p style="font-size:13.5px;color:var(--ink-2);margin-top:8px;font-weight:500">프로필, 참여 내역, 메시지, 크루 가입이 모두 초기화돼요.</p>
      <button class="btn btn-danger" style="margin-top:16px" onclick="localStorage.removeItem(Store.key);location.reload()">로그아웃</button>
      <button class="btn btn-ghost" style="margin-top:8px" onclick="closeSheet()">취소</button>
    </div>`);
};

/* ── 동네 시세 지도 (김캐디식 거리 지도 + 가격 핀) ── */
let nearbyState = { district: "gangnam", dayOff: 0, hour: 19, z: null };
function nearbyPrice(c, dayOff, hour) {
  const d = new Date(BOOT.getFullYear(), BOOT.getMonth(), BOOT.getDate() + dayOff);
  const wk = d.getDay() === 0 || d.getDay() === 6;
  const base = hour >= 18 || hour < 6 ? c.room.night : c.room.day;
  return base + (wk ? 3000 : 0);
}
function manFmt(n) {
  const m = n / 10000;
  return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + "만";
}
function renderNearby() {
  const D = DISTRICTS.find(d => d.id === nearbyState.district);
  const vs = COURSES.filter(c => isScreen(c) && c.district === nearbyState.district);
  const days = [0, 1, 2, 3, 4].map(off => {
    const d = new Date(BOOT.getFullYear(), BOOT.getMonth(), BOOT.getDate() + off);
    return { off, label: `${DOW[d.getDay()]}(${d.getDate()})`, wk: d.getDay() === 0 || d.getDay() === 6 };
  });
  const hours = [15, 17, 19, 21, 23];
  appEl.innerHTML = `
  <div class="view" style="padding-bottom:40px">
    <div class="page-head">
      <button class="back" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button>
      <h1>동네 시세 지도</h1>
      <span style="margin-left:auto" class="tag blue"><i class="ph-fill ph-monitor-play"></i>스크린</span>
    </div>
    <div class="chips" id="nb-district">
      ${DISTRICTS.map(d => `<button class="chip ${nearbyState.district === d.id ? "on" : ""}" data-d="${d.id}">${d.name}</button>`).join("")}
    </div>
    <div class="px"><div class="nb-bar in">
      <div class="nb-bar-row"><span class="nb-bar-label">날짜</span>
        ${days.map(d => `<button class="nb-opt ${nearbyState.dayOff === d.off ? "on" : ""} ${d.wk ? "wk" : ""}" data-day="${d.off}">${d.label}</button>`).join("")}
      </div>
      <div class="nb-bar-row"><span class="nb-bar-label">시간</span>
        ${hours.map(h => `<button class="nb-opt ${nearbyState.hour === h ? "on" : ""}" data-hour="${h}">${String(h).padStart(2, "0")}:00</button>`).join("")}
      </div>
    </div></div>
    <div class="px" style="margin-top:12px">
      <div class="nb-map-wrap in">
        <div id="nb-map"></div>
        <div class="nb-zoom">
          <button onclick="nbZoom(1)"><i class="ph-bold ph-plus"></i></button>
          <button onclick="nbZoom(-1)"><i class="ph-bold ph-minus"></i></button>
        </div>
      </div>
      <p style="margin-top:9px;font-size:11.5px;color:var(--ink-3);font-weight:600">${D.sub} 기준 · 브랜드 표준 시세로 계산한 룸 1시간 추정 요금이에요. 정확한 요금은 각 매장에서 확인하세요.</p>
    </div>
    <div class="h-sec px"><h2>이 동네 매장 ${vs.length}곳</h2><span class="more">가격 낮은 순</span></div>
    <div class="px">
      ${vs.slice().sort((a, b) => nearbyPrice(a, nearbyState.dayOff, nearbyState.hour) - nearbyPrice(b, nearbyState.dayOff, nearbyState.hour)).map(c => {
        const open = postsForCourse(c.id);
        const bp = BRAND_PIN[c.brandShort] || BRAND_PIN["골프존"];
        return `<div class="map-sheet-card in" onclick="location.hash='#/course/${c.id}'">
          <div class="sat" style="width:56px;height:56px;border-radius:16px;flex:none">${satShot(c, 17)}</div>
          <div style="flex:1;min-width:0">
            <b style="font-size:14.5px">${c.name}</b>
            <div style="font-size:11.5px;color:var(--ink-3);font-weight:600;margin-top:3px">${c.addr.replace(/서울특별시 |부산광역시 |대전광역시 |경기도 |제주특별자치도 /, "")} · ${c.rating}점</div>
            <div style="display:flex;gap:5px;margin-top:6px;flex-wrap:wrap">
              <span class="tag" style="font-size:10.5px"><span style="width:14px;height:14px;border-radius:4px;background:${bp.bg};color:${bp.fg};font-weight:900;font-size:9.5px;display:inline-flex;align-items:center;justify-content:center">${bp.ch}</span>${c.brandShort}</span>
              ${open.length ? '<span class="tag green" style="font-size:10.5px"><i class="ph-fill ph-lightning"></i>즉시확정 모집</span>' : ""}
              ${c.partner ? '<span class="tag lime" style="font-size:10.5px">할인이용권</span>' : ""}
            </div>
          </div>
          <div style="text-align:right;flex:none"><b style="font-size:16.5px;font-weight:900">${manFmt(nearbyPrice(c, nearbyState.dayOff, nearbyState.hour))}</b>
          <div style="font-size:10.5px;color:var(--ink-3);font-weight:700">시간당</div></div>
        </div>`;
      }).join("")}
    </div>
  </div>`;
  stagger();
  mountNearbyMap();
  $("#nb-district").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    nearbyState.district = b.dataset.d;
    nearbyState.z = null;
    renderNearby();
  });
  $$(".nb-opt").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.day !== undefined) nearbyState.dayOff = +b.dataset.day;
    if (b.dataset.hour !== undefined) nearbyState.hour = +b.dataset.hour;
    renderNearby();
  }));
}
function mountNearbyMap() {
  const box = $("#nb-map");
  if (!box) return;
  const D = DISTRICTS.find(d => d.id === nearbyState.district);
  const w = box.clientWidth, h = box.clientHeight;
  if (w < 60 || h < 60) { requestAnimationFrame(() => mountNearbyMap()); return; }
  const dvs = COURSES.filter(c => isScreen(c) && c.district === nearbyState.district);
  // 지역 매장 전체가 들어오도록 중심과 줌 자동 맞춤
  const lats = dvs.map(c => c.lat), lngs = dvs.map(c => c.lng);
  const clat = dvs.length ? (Math.max(...lats) + Math.min(...lats)) / 2 : D.lat;
  const clng = dvs.length ? (Math.max(...lngs) + Math.min(...lngs)) / 2 : D.lng;
  if (!nearbyState.z) {
    let zf = 17;
    for (; zf > 13; zf--) {
      const [x1, y1] = tileXY(Math.max(...lats), Math.min(...lngs), zf);
      const [x2, y2] = tileXY(Math.min(...lats), Math.max(...lngs), zf);
      if (Math.abs(x2 - x1) * 256 < w - 110 && Math.abs(y2 - y1) * 256 < h - 150) break;
    }
    nearbyState.z = zf;
  }
  const z = nearbyState.z;
  const [xf, yf] = tileXY(clat, clng, z);
  const cx = xf * 256, cy = yf * 256;
  let html = "";
  const tx0 = Math.floor((cx - w / 2) / 256), tx1 = Math.floor((cx + w / 2) / 256);
  const ty0 = Math.floor((cy - h / 2) / 256), ty1 = Math.floor((cy + h / 2) / 256);
  for (let tx = tx0; tx <= tx1; tx++) for (let ty = ty0; ty <= ty1; ty++) {
    const left = tx * 256 - (cx - w / 2), top = ty * 256 - (cy - h / 2);
    const sub = "abcd"[Math.abs(tx + ty) % 4];
    html += `<img class="nb-tile" style="left:${left}px;top:${top}px" src="https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${tx}/${ty}@2x.png" alt="">`;
  }
  // 디렉토리 스크린 매장 (시세 미등록: 브랜드 점으로 표시)
  let dotN = 0;
  DIRV.forEach((v, i) => {
    if (v.k !== "s" || dotN > 40) return;
    const [vx, vy] = tileXY(v.lat, v.lng, z);
    const px = vx * 256 - (cx - w / 2), py = vy * 256 - (cy - h / 2);
    if (px < 14 || px > w - 14 || py < 14 || py > h - 14) return;
    const bs = v.n.includes("프렌즈") ? "카카오VX" : (v.n.includes("티업") || v.n.toUpperCase().includes("SG")) ? "SG골프" : "골프존";
    const bp = BRAND_PIN[bs];
    dotN++;
    html += `<button class="nb-dot" style="left:${px}px;top:${py}px;background:${bp.bg};color:${bp.fg}" onclick="location.hash='#/course/dv${i}'" aria-label="${v.n}">${bp.ch}</button>`;
  });
  dvs.forEach((c, i) => {
    const [vx, vy] = tileXY(c.lat, c.lng, z);
    const px = vx * 256 - (cx - w / 2), py = vy * 256 - (cy - h / 2);
    if (px < -20 || px > w + 20 || py < -20 || py > h + 20) return;
    const bp = BRAND_PIN[c.brandShort] || BRAND_PIN["골프존"];
    const inst = postsForCourse(c.id).some(p => p.instant);
    html += `<button class="nb-pin in" style="left:${px}px;top:${py}px;animation-delay:${i * 70}ms" onclick="pinSheet('${c.id}')">
      ${inst ? '<span class="nb-inst"><i class="ph-fill ph-lightning"></i>즉시확정</span>' : ""}
      <span class="nb-price"><span class="nb-brand" style="background:${bp.bg};color:${bp.fg}">${bp.ch}</span>${manFmt(nearbyPrice(c, nearbyState.dayOff, nearbyState.hour))}</span>
    </button>`;
  });
  html += `<div class="nb-attr">지도 © OpenStreetMap · CARTO</div>`;
  box.innerHTML = html;
}
window.nbZoom = d => {
  nearbyState.z = Math.max(14, Math.min(17, nearbyState.z + d));
  mountNearbyMap();
};

/* ── 전국 검색 (골프장 + 스크린 디렉토리) ── */
let searchState = { q: "", kind: "전체", region: "전체" };
function allVenues() {
  const cur = COURSES.map(c => ({ id: c.id, name: c.name, region: c.region, city: c.city, scr: isScreen(c), rng: false, cur: true, t: c.type }));
  const dir = DIRV.map((v, i) => ({ id: "dv" + i, name: v.n, region: v.r, city: v.a ? v.a.split(" ").slice(0, 2).join(" ") : (v.c || v.r), scr: v.k === "s", rng: v.k === "r", cur: false, t: v.t || "" }));
  return cur.concat(dir);
}
function searchRows() {
  const q = searchState.q.trim().toLowerCase();
  let list = allVenues()
    .filter(v => searchState.kind === "전체" || (searchState.kind === "스크린" ? v.scr : searchState.kind === "연습장" ? v.rng : !v.scr && !v.rng))
    .filter(v => searchState.region === "전체" || v.region === searchState.region)
    .filter(v => !q || v.name.toLowerCase().includes(q));
  const total = list.length;
  list = list.slice(0, 80);
  const rows = list.map(v => `
    <div class="s-row in" onclick="location.hash='#/course/${v.id}'">
      <span class="s-ic ${v.scr ? "scr" : v.rng ? "rng" : ""}"><i class="ph-fill ${v.scr ? "ph-monitor-play" : v.rng ? "ph-barbell" : "ph-golf"}"></i></span>
      <div style="flex:1;min-width:0">
        <b>${v.name}</b>
        <div class="s-sub">${v.region}${v.city && v.city !== v.region ? " · " + v.city : ""}${v.t && !v.scr ? " · " + v.t : ""}${v.cur ? "" : ""}</div>
      </div>
      ${v.cur ? '<span class="tag lime" style="font-size:10px;flex:none">상세 등록</span>' : ""}
      <i class="ph-bold ph-caret-right" style="color:var(--ink-3);flex:none"></i>
    </div>`).join("");
  return { rows: rows || '<div class="empty" style="padding:40px 20px"><b>검색 결과가 없어요</b><p>다른 검색어나 지역으로 찾아보세요.</p></div>', total };
}
function renderSearch() {
  const { rows, total } = searchRows();
  const allN = allVenues().length;
  appEl.innerHTML = `
  <div class="view" style="padding-bottom:40px">
    <div class="page-head">
      <button class="back" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button>
      <h1>전국 검색</h1>
      <span style="margin-left:auto;font-size:12px;font-weight:800;color:var(--ink-3)">${allN.toLocaleString()}곳 등록</span>
    </div>
    <div class="px"><div class="f-input in"><i class="ph-bold ph-magnifying-glass" style="color:var(--ink-3)"></i>
      <input id="s-q" placeholder="골프장 · 스크린 매장 이름 검색" value="${searchState.q}"></div></div>
    <div class="chips" id="s-kind" style="margin-top:10px;padding-bottom:2px">
      ${["전체", "필드", "스크린", "연습장"].map(k => `<button class="chip ${searchState.kind === k ? "on" : ""}" data-k="${k}">${k === "필드" ? '<i class="ph-fill ph-golf"></i> ' : k === "스크린" ? '<i class="ph-fill ph-monitor-play"></i> ' : k === "연습장" ? '<i class="ph-fill ph-barbell"></i> ' : ""}${k}</button>`).join("")}
    </div>
    <div class="chips" id="s-region">
      ${REGIONS.map(r => `<button class="chip ${searchState.region === r ? "on" : ""}" data-r="${r}">${r}</button>`).join("")}
    </div>
    <div class="px" style="margin-top:4px">
      <div style="font-size:12px;font-weight:700;color:var(--ink-3);margin-bottom:9px" id="s-count">${total.toLocaleString()}곳${total > 80 ? " 중 80곳 표시 · 검색어로 좁혀보세요" : ""}</div>
      <div id="s-list">${rows}</div>
    </div>
  </div>`;
  const refresh = () => {
    const r = searchRows();
    $("#s-list").innerHTML = r.rows;
    $("#s-count").textContent = r.total.toLocaleString() + "곳" + (r.total > 80 ? " 중 80곳 표시 · 검색어로 좁혀보세요" : "");
  };
  $("#s-q").addEventListener("input", e => { searchState.q = e.target.value; refresh(); });
  $("#s-kind").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    searchState.kind = b.dataset.k;
    $$("#s-kind .chip").forEach(x => x.classList.toggle("on", x === b));
    refresh();
  });
  $("#s-region").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    searchState.region = b.dataset.r;
    $$("#s-region .chip").forEach(x => x.classList.toggle("on", x === b));
    refresh();
  });
}

/* ── 연습장 구독 나눠쓰기 ── */
function subCard(s) {
  const h = hostById(s.hostId);
  const off = Math.round((1 - s.price / s.normal) * 100);
  return `
  <div class="post-card in" onclick="subSheet('${s.id}')">
    <div class="pc-main">
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px">
        <span class="tag" style="background:#EDE4FB;color:#6B3FC9"><i class="ph-fill ph-barbell"></i>연습장 구독</span>
        ${s.verified ? '<span class="tag green"><i class="ph-fill ph-seal-check"></i>회원권 인증</span>' : ""}
      </div>
      <div class="pc-title">${s.venue}</div>
      <div class="pc-meta">${s.days} ${s.time} · ${s.pass} · ${s.city}</div>
      <div class="pc-row">
        <div class="pc-price"><del>${won(s.normal)}</del><b>${won(s.price)}<small>/회</small></b></div>
        <span class="pc-need">${s.remain}회 남음</span>
      </div>
      <div style="display:flex;align-items:center;gap:7px;margin-top:10px">
        ${avat(h)}
        <span style="font-size:12px;font-weight:700;color:var(--ink-2)">${h.name} · 그린지수 ${h.temp.toFixed(1)}</span>
        <span class="tag red" style="margin-left:auto">${off}% 할인</span>
      </div>
    </div>
  </div>`;
}
window.subSheet = id => {
  const s = SUBS.find(x => x.id === id);
  if (!s) return;
  const h = hostById(s.hostId);
  const joined = S.subJoined.includes(id);
  openSheet(`
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
      <span class="tag" style="background:#EDE4FB;color:#6B3FC9"><i class="ph-fill ph-barbell"></i>연습장 구독 나눠쓰기</span>
      ${s.verified ? '<span class="tag green"><i class="ph-fill ph-seal-check"></i>회원권 인증</span>' : ""}
    </div>
    <div style="font-size:19px;font-weight:900">${s.venue}</div>
    <div style="font-size:13px;color:var(--ink-2);font-weight:600;margin-top:5px"><i class="ph-fill ph-map-pin" style="color:var(--green-2)"></i> ${s.city} · ${s.until}</div>
    <div class="fee-row" style="margin-top:12px"><span>이용 가능 시간</span><b>${s.days} ${s.time}</b></div>
    <div class="fee-row"><span>구독권</span><b>${s.pass}</b></div>
    <div class="fee-row"><span>정상 회당 가격</span><b><del style="color:var(--ink-3);font-weight:600">${won(s.normal)}</del></b></div>
    <div class="fee-row"><span>남은 회차</span><b>${s.remain}회</b></div>
    <div class="fee-row total"><span>나눠쓰기 가격</span><b>${won(s.price)} /회</b></div>
    <div style="display:flex;align-items:center;gap:9px;margin-top:14px;background:var(--bg);border-radius:14px;padding:12px">
      ${avat(h)}
      <div><b style="font-size:13.5px">${h.name}</b><div style="font-size:11.5px;color:var(--ink-3);font-weight:600">그린지수 ${h.temp.toFixed(1)} · ${h.career}</div></div>
      <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="closeSheet();openChat('${h.id}')"><i class="ph-fill ph-chat-circle-dots"></i>메시지</button>
    </div>
    <p style="margin-top:12px;font-size:13px;line-height:1.6;color:var(--ink-2);font-weight:500">"${s.memo}"</p>
    <div style="margin-top:12px;background:var(--bg);border-radius:14px;padding:12px;font-size:12px;color:var(--ink-2);font-weight:600;line-height:1.6">
      연습장 회원권 규정상 동반 이용이 가능한 매장만 등록돼요. 정산은 현장결제 또는 계좌이체로 진행됩니다.
    </div>
    <button class="btn btn-primary" style="margin-top:16px" onclick="joinSub('${s.id}')" ${joined ? "disabled" : ""}>${joined ? "이용 중이에요" : won(s.price) + "에 나눠쓰기 시작"}</button>
    <button class="btn btn-ghost" style="margin-top:8px" onclick="closeSheet()">닫기</button>
  `);
};
window.joinSub = id => {
  if (!S.user) { closeSheet(); toast("이용하려면 프로필이 필요해요", "user-circle-plus"); location.hash = "#/signup"; return; }
  const s = SUBS.find(x => x.id === id);
  if (!S.subJoined.includes(id)) S.subJoined.push(id);
  Store.save();
  closeSheet();
  if (!S.chats[s.hostId]) S.chats[s.hostId] = [];
  scheduleReply(s.hostId, `${s.venue} 나눠쓰기 신청 확인했어요! 첫 이용 날짜 알려주시면 동반 등록해둘게요. 정산은 회당 ${won(s.price)}입니다.`);
  toast("나눠쓰기 시작! 호스트가 채팅으로 안내해드려요");
  render();
};

/* ══════════ 라우터 ══════════ */
function render() {
  const hash = location.hash || "#/home";
  const [_, route, param] = hash.split("/");
  window.scrollTo(0, 0);
  closeSheet();

  const tabbar = $("#tabbar");
  const hideTab = ["ob", "signup", "post", "course", "user", "new", "chat", "pay", "settings", "nearby", "search"].includes(route);
  tabbar.classList.toggle("hidden", hideTab);
  $$("#tabbar .tab").forEach(t => t.classList.toggle("active", t.dataset.route === "#/" + route));
  const meDot = $("#tab-me-dot");
  if (meDot) meDot.classList.toggle("hidden", unreadTotal() === 0);

  switch (route) {
    case "ob": renderOb(); break;
    case "signup": renderSignup(); break;
    case "map": renderMap(); break;
    case "post": renderPost(param); break;
    case "course": renderCourse(param); break;
    case "new": renderNew(); break;
    case "crew": param ? renderCrew(param) : renderCrews(); break;
    case "me": renderMe(); break;
    case "user": renderUser(param); break;
    case "alerts": renderAlerts(); break;
    case "chat": param ? renderThread(param) : renderChatList(); break;
    case "pay": renderPay(); break;
    case "settings": renderSettings(); break;
    case "nearby": renderNearby(); break;
    case "search": renderSearch(); break;
    default: renderHome();
  }
}
window.addEventListener("hashchange", render);
$$("#tabbar .tab").forEach(t => t.addEventListener("click", () => { location.hash = t.dataset.route; }));

/* ── 부트 ─────────────────────────────── */
window.closeSheet = closeSheet;
setTimeout(() => {
  $("#splash").classList.add("out");
  if (!S.user && !S.seenOb && (!location.hash || location.hash === "#" || location.hash === "#/")) location.hash = "#/ob";
  render();
}, 1500);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
