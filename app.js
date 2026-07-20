/* ══════════════════ LASTTEE app ══════════════════ */
"use strict";

/* ── 유틸 ─────────────────────────────── */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const appEl = $("#app");
const won = n => "₩" + Math.round(n).toLocaleString("ko-KR");
const BOOT = new Date();
const DOW = ["일", "월", "화", "수", "목", "금", "토"];

const courseById = id => COURSES.find(c => c.id === id);
const hostById = id => HOSTS.find(h => h.id === id);

/* ── 스토어 ────────────────────────────── */
const Store = {
  key: "lt_store_v1",
  data: { user: null, seenOb: false, joined: [], myPosts: [], crews: [], likes: [], crewFeed: {}, closed: [] },
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) this.data = Object.assign(this.data, JSON.parse(raw));
    } catch (e) {}
  },
  save() { localStorage.setItem(this.key, JSON.stringify(this.data)); },
};
Store.load();
const S = Store.data;

/* ── 티오프 시간 계산 ───────────────────── */
// 오늘(day 0) 모집은 부팅 시점 기준 상대 시간 → 언제 봐도 카운트다운이 살아있음
const DAY0_OFFSET_H = { p1: 2.4, p2: 4.9, p4: 6.3, p10: 3.2 };
function teeDate(p) {
  if (p.day === 0 && DAY0_OFFSET_H[p.id]) {
    return new Date(BOOT.getTime() + DAY0_OFFSET_H[p.id] * 3600e3);
  }
  const [h, m] = p.tee.split(":").map(Number);
  const d = new Date(BOOT.getFullYear(), BOOT.getMonth(), BOOT.getDate() + p.day, h, m);
  if (p.day === 0 && d < BOOT) d.setDate(d.getDate() + 1); // 사용자 생성 오늘 모집 보호
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

/* ── 코스 일러스트 (절차적 SVG) ─────────────── */
function seedRand(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822519); h = Math.imul(h ^ (h >>> 13), 3266489917); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
function courseArt(course, variant = 0) {
  const r = seedRand(course.id + variant);
  const hue = course.hue;
  const skies = [
    ["#BDE8FF", "#E8F7FF"], // 낮
    ["#FFB88A", "#FFE3C2"], // 노을
    ["#D9C8F5", "#FDE7EF"], // 새벽
  ];
  const [s1, s2] = skies[variant % 3];
  const g = l => `hsl(${hue},46%,${l}%)`;
  let trees = "";
  for (let i = 0; i < 5; i++) {
    const tx = 12 + r() * 176, ty = 66 + r() * 14, tr = 5 + r() * 5;
    trees += `<circle cx="${tx}" cy="${ty}" r="${tr}" fill="${g(24 + r() * 8)}"/>`;
  }
  let clouds = "";
  for (let i = 0; i < 3; i++) {
    const cx = 20 + r() * 160, cy = 12 + r() * 22;
    clouds += `<ellipse cx="${cx}" cy="${cy}" rx="${14 + r() * 12}" ry="${4 + r() * 3}" fill="#fff" opacity="${0.5 + r() * 0.3}"/>`;
  }
  const bx = 46 + r() * 100, fx = 120 + r() * 50;
  const water = variant === 1 ? `<ellipse cx="${30 + r() * 40}" cy="112" rx="34" ry="9" fill="#7EC8E3" opacity=".85"/>` : "";
  return `<svg viewBox="0 0 200 130" preserveAspectRatio="xMidYMid slice">
    <rect width="200" height="130" fill="url(#sky${course.id}${variant})"/>
    <defs><linearGradient id="sky${course.id}${variant}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient></defs>
    ${clouds}
    ${variant === 1 ? '<circle cx="160" cy="30" r="13" fill="#FF9E5E"/>' : '<circle cx="162" cy="26" r="10" fill="#FFF3B0" opacity=".9"/>'}
    <path d="M0 78 Q 50 ${58 + r() * 10} 100 74 T 200 70 V130 H0 Z" fill="${g(30)}"/>
    <path d="M0 92 Q 60 ${76 + r() * 8} 120 90 T 200 86 V130 H0 Z" fill="${g(38)}"/>
    <path d="M0 108 Q 70 ${94 + r() * 8} 140 106 T 200 102 V130 H0 Z" fill="${g(46)}"/>
    ${trees}
    ${water}
    <ellipse cx="${bx}" cy="116" rx="17" ry="5.5" fill="#EFE3B0"/>
    <ellipse cx="${fx}" cy="112" rx="26" ry="7" fill="${g(56)}"/>
    <circle cx="${fx}" cy="112" r="1.6" fill="#083D28"/>
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

function avat(pers, size = "") {
  return `<div class="av g${pers.g} ${size}">${pers.avatar}</div>`;
}
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

/* 카운트다운 틱 */
setInterval(() => {
  $$("[data-cd]").forEach(el => {
    const left = +el.dataset.cd - Date.now();
    if (left <= 0) { el.textContent = "티오프!"; return; }
    const h = Math.floor(left / 3600e3), m = Math.floor(left % 3600e3 / 60e3), s = Math.floor(left % 60e3 / 1e3);
    el.textContent = (h > 0 ? h + ":" : "") + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  });
}, 1000);

/* ── 카드 컴포넌트 ─────────────────────── */
function hotCard(p) {
  const c = courseById(p.courseId);
  return `
  <div class="hot-card in" onclick="location.hash='#/post/${p.id}'">
    <div class="hot-art">${courseArt(c, 0)}
      <div class="hot-timer"><i class="ph-fill ph-timer"></i><span data-cd="${teeDate(p).getTime()}">--:--</span></div>
      <div class="hot-off">${discount(p)}%↓</div>
    </div>
    <div class="hot-body">
      <div class="hot-course">${c.name}</div>
      <div class="hot-meta"><i class="ph-fill ph-map-pin"></i>${c.city} · ${dayLabel(p)} ${teeStr(p)} · ${p.holes}홀</div>
      <div class="hot-price"><del>${won(p.normal)}</del><b>${won(p.price)}<small> /1인</small></b></div>
    </div>
  </div>`;
}
function postCard(p) {
  const c = courseById(p.courseId);
  const left = slotsLeft(p);
  const js = joinerIds(p).slice(0, 3).map(id => { const h = personOf(id); return `<div class="av g${h.g}">${h.avatar}</div>`; }).join("");
  const mine = p.hostId === "me";
  return `
  <div class="post-card in" onclick="location.hash='#/post/${p.id}'">
    ${mine ? '<div class="mine-flag">내 모집</div>' : ""}
    <div class="pc-art">${courseArt(c, 0)}<div class="pc-off">${discount(p)}% OFF</div></div>
    <div class="pc-main">
      <div class="pc-title">${c.name}</div>
      <div class="pc-meta">${dayLabel(p)} ${teeStr(p)} · ${p.holes}홀 · ${c.city}</div>
      <div class="pc-row">
        <div class="pc-price"><del>${won(p.normal)}</del><b>${won(p.price)}<small>/1인</small></b></div>
        <div class="pc-slots"><div class="pc-avatars">${js}</div><span class="pc-need">${left}자리</span></div>
      </div>
      <div class="pc-badges">${p.tags.slice(0, 3).map(t => `<span class="tag ${t.includes("초보") ? "lime" : ""}">${t}</span>`).join("")}${p.instant ? '<span class="tag green"><i class="ph-fill ph-lightning"></i>즉시확정</span>' : ""}</div>
    </div>
  </div>`;
}

/* ── 지도 ─────────────────────────────── */
function koreaMap(h = 430, interactive = true) {
  const rows = KOREA_GRID.length, cols = KOREA_GRID[0].length;
  let dots = "";
  KOREA_GRID.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === "#" || ch === "j") {
        dots += `<div class="map-dot" style="left:${((x + 0.5) / cols * 100).toFixed(1)}%;top:${((y + 0.5) / rows * 100).toFixed(1)}%"></div>`;
      }
    });
  });
  const labels = MAP_LABELS.map(l => `<div class="map-label" style="left:${l.x}%;top:${l.y}%">${l.t}</div>`).join("");
  const pins = COURSES.map((c, i) => {
    const n = postsForCourse(c.id).length;
    return `<button class="pin ${n ? "" : "dim"}" style="left:${c.gx}%;top:${c.gy}%" ${interactive ? `onclick="event.stopPropagation();pinSheet('${c.id}')"` : ""}>
      <span class="pin-dot" style="animation-delay:${i * 60}ms"><i class="ph-fill ph-golf"></i></span>
      <span class="pin-n">${c.name.split(" ")[0]}${n ? " · " + n : ""}</span>
    </button>`;
  }).join("");
  return `<div class="map-box" style="height:${h}px"><div class="map-grid">${dots}</div>${labels}${pins}</div>`;
}
window.pinSheet = cid => {
  const c = courseById(cid);
  const posts = postsForCourse(cid);
  openSheet(`
    <div style="display:flex;gap:13px;align-items:center;margin-bottom:16px">
      <div style="width:64px;height:64px;border-radius:18px;overflow:hidden;flex:none">${courseArt(c, 0)}</div>
      <div>
        <div style="font-size:17px;font-weight:900">${c.name}</div>
        <div style="font-size:12.5px;color:var(--ink-3);font-weight:600;margin-top:3px">${c.city} · ${c.holes}홀 · ${c.type} · ⭐ ${c.rating}</div>
      </div>
    </div>
    ${posts.length
      ? posts.map(p => `<div class="map-sheet-card" onclick="closeSheet();location.hash='#/post/${p.id}'">
          <div style="flex:1"><b style="font-size:14.5px">${dayLabel(p)} ${teeStr(p)} · ${p.holes}홀</b>
          <div style="font-size:12px;color:var(--ink-3);font-weight:600;margin-top:3px">${slotsLeft(p)}자리 남음 · ${p.reason}</div></div>
          <div style="text-align:right"><b style="font-size:16px;font-weight:900">${won(p.price)}</b>
          <div style="font-size:11px;color:var(--red);font-weight:800">${discount(p)}% 할인</div></div>
        </div>`).join("")
      : '<div class="empty" style="padding:26px"><b>지금은 조인 모집이 없어요</b><p>이 골프장의 새 모집이 올라오면 알려드릴게요.</p></div>'}
    <button class="btn btn-ghost" style="margin-top:12px" onclick="closeSheet();location.hash='#/course/${c.id}'">골프장 상세 보기</button>
  `);
};

/* ══════════════════ 뷰 ══════════════════ */

/* ── 온보딩 ───────────────────────────── */
function renderOb() {
  appEl.innerHTML = `
  <div class="ob view">
    <div class="ob-slides" id="ob-slides">
      <div class="ob-slide">
        <div class="ob-art">⛳</div>
        <h2>일행이 취소한<br>그 티타임, <em>반값</em>이 됩니다</h2>
        <p>4인 예약에 한 명이 빠지면 남은 사람들이 위약금을 떠안죠. 라스트티에선 그 빈자리가 당신의 할인 티타임이 됩니다.</p>
      </div>
      <div class="ob-slide">
        <div class="ob-art">🗺️</div>
        <h2>전국 골프장의<br><em>빈자리</em>를 실시간으로</h2>
        <p>지도에서 지금 열려있는 조인을 한눈에. 티오프까지 남은 시간, 할인율, 동반자 매너 점수까지 확인하고 조인하세요.</p>
      </div>
      <div class="ob-slide">
        <div class="ob-art">🤝</div>
        <h2>혼자 조인해도<br><em>크루</em>가 생깁니다</h2>
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
  const sel = { avatar: u.avatar || AVATARS[0], g: u.g ?? 0, gender: u.gender || "남", age: u.age || "30대", career: u.career || CAREERS[2], region: u.region || "수도권", avg: u.avg || 95, styles: u.styles || [], verified: u.verified || false };
  appEl.innerHTML = `
  <div class="view form-page">
    <button class="back" style="width:38px;height:38px;border-radius:13px;background:var(--card);box-shadow:var(--shadow-sm);display:flex;align-items:center;justify-content:center" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button>
    <h1>${S.user ? "프로필 수정" : "라운드 나가기 전,<br>프로필을 만들어주세요"}</h1>

    <label class="f-label">닉네임</label>
    <div class="f-input"><i class="ph ph-golf" style="color:var(--ink-3)"></i><input id="su-nick" maxlength="10" placeholder="라운드에서 불릴 이름" value="${u.nick || ""}"></div>

    <label class="f-label">아바타</label>
    <div class="av-pick" id="su-av">${AVATARS.map((a, i) => `<button class="av g${i % 6} ${a === sel.avatar ? "on" : ""}" data-a="${a}" data-g="${i % 6}">${a}</button>`).join("")}</div>

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
    const b = e.target.closest("button"); if (!b) return;
    $$("#su-av button").forEach(x => x.classList.remove("on")); b.classList.add("on");
    sel.avatar = b.dataset.a; sel.g = +b.dataset.g;
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
    toast(`${nick}님, 환영해요! 좋은 라운드 잡아드릴게요 ⛳`);
    location.hash = "#/home";
  });
}

/* ── 홈 ──────────────────────────────── */
let homeState = { region: "전체", sort: "임박순" };
function renderHome() {
  const open = openPosts();
  const today = open.filter(p => teeDate(p).getDate() === BOOT.getDate() && teeDate(p) - BOOT < 864e5).sort((a, b) => teeDate(a) - teeDate(b));
  const avgOff = Math.round(open.reduce((s, p) => s + discount(p), 0) / (open.length || 1));
  const maxSave = Math.max(...open.map(p => p.normal - p.price), 0);
  const nickname = S.user ? S.user.nick + "님" : "골퍼님";

  const filtered = open
    .filter(p => homeState.region === "전체" || courseById(p.courseId).region === homeState.region)
    .sort((a, b) => homeState.sort === "임박순" ? teeDate(a) - teeDate(b) : homeState.sort === "할인순" ? discount(b) - discount(a) : a.price - b.price);

  appEl.innerHTML = `
  <div class="view">
    <div class="hero">
      <div class="hero-top">
        <div class="hero-logo"><span class="dot"></span>LASTTEE</div>
        <button class="hero-bell" onclick="location.hash='#/alerts'"><i class="ph-fill ph-bell"></i><span class="badge"></span></button>
      </div>
      <h1>${nickname},<br>지금 <em>빈자리 ${open.length}개</em>가<br>기다리고 있어요</h1>
      <div class="hero-sub">일행 취소로 비어버린 티타임을 할인가로 잡으세요</div>
      <div class="hero-stats">
        <div class="hs"><b id="st-today">0</b><span>마감 임박</span></div>
        <div class="hs"><b id="st-off">0%</b><span>평균 할인율</span></div>
        <div class="hs"><b id="st-save">₩0</b><span>최대 절약액</span></div>
      </div>
    </div>

    <div class="hot-wrap">
      <div class="hot-scroll">${today.map(hotCard).join("") || '<div class="empty" style="width:100%"><b>오늘 마감 임박 조인이 없어요</b></div>'}</div>
    </div>

    <div class="ticker"><div class="ticker-in">
      <em>●</em>방금 이*현님이 블루원 상주 조인 확정 — 48% 할인
      <em>●</em>3분 전 김*연님이 스카이72 조인 신청
      <em>●</em>7분 전 새 모집: 설해원 GC 내일 11시 — 37% 할인
      <em>●</em>12분 전 박*진님이 그린지수 5.0 후기를 받았어요
    </div></div>

    <div class="h-sec px"><h2>지금 열린 조인</h2><span class="more" onclick="location.hash='#/map'">지도로 보기 →</span></div>
    <div class="chips" id="home-chips">
      ${REGIONS.map(r => `<button class="chip ${homeState.region === r ? "on" : ""}" data-r="${r}">${r}</button>`).join("")}
      <button class="chip" id="home-sort" style="margin-left:auto">${homeState.sort} <i class="ph-bold ph-caret-down"></i></button>
    </div>
    <div class="px" id="home-list">
      ${filtered.map(postCard).join("") || '<div class="empty"><span class="big">🏌️</span><b>이 지역엔 아직 모집이 없어요</b><p>다른 지역을 보거나, 직접 모집을 올려보세요.</p></div>'}
    </div>

    <div class="px" style="margin-top:28px">
      <div class="info-card in">
        <h3>어떻게 <em>이 가격</em>이 가능해요?</h3>
        <div class="info-step"><span class="n">1</span><p>골프장은 <b>4인 기준 예약</b>이 원칙이라, 한 명이 빠지면 남은 일행이 <b>위약금·미달 그린피</b>를 떠안아요.</p></div>
        <div class="info-step"><span class="n">2</span><p>호스트는 위약금을 무는 대신, <b>빈자리를 할인가에 양도</b>합니다. 서로에게 이득인 거래예요.</p></div>
        <div class="info-step"><span class="n">3</span><p>캐디피·카트비도 <b>4명이 나눠</b> 1/N. 혼자였으면 못 갔을 라운드가 반값이 됩니다.</p></div>
      </div>
    </div>

    <div class="h-sec px"><h2>같이 칠 사람들</h2><span class="more" onclick="location.hash='#/crew'">크루 전체 →</span></div>
    <div class="px">
      ${CREWS.slice(0, 2).map(crewCard).join("")}
    </div>

    <div class="px" style="margin-top:24px">
      <div class="partner-card in">
        <div class="ic">🤝</div>
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

  $("#home-chips").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    if (b.id === "home-sort") {
      const order = ["임박순", "할인순", "낮은가격순"];
      homeState.sort = order[(order.indexOf(homeState.sort) + 1) % order.length];
    } else homeState.region = b.dataset.r;
    renderHome();
  });
}

/* ── 지도 뷰 ───────────────────────────── */
function renderMap() {
  const open = openPosts();
  appEl.innerHTML = `
  <div class="view">
    <div class="page-head"><h1>빈자리 지도</h1>
      <span style="margin-left:auto" class="tag lime"><i class="ph-fill ph-lightning"></i>실시간 ${open.length}건</span>
    </div>
    <div class="px in">${koreaMap(470)}</div>
    <div class="px" style="margin-top:14px">
      <div class="d-card in" style="margin:0;padding:16px 18px;display:flex;gap:16px;align-items:center">
        <span style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--ink-2)"><span style="width:12px;height:12px;border-radius:50%;background:var(--lime);display:inline-block"></span>조인 모집 중</span>
        <span style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--ink-2)"><span style="width:12px;height:12px;border-radius:50%;background:#57705F;display:inline-block"></span>모집 없음</span>
      </div>
    </div>
    <div class="h-sec px"><h2>제휴 골프장</h2></div>
    <div class="px">
      ${COURSES.filter(c => c.partner).map(c => `
        <div class="map-sheet-card in" onclick="location.hash='#/course/${c.id}'">
          <div style="width:56px;height:56px;border-radius:16px;overflow:hidden;flex:none">${courseArt(c, 0)}</div>
          <div style="flex:1"><b style="font-size:14.5px">${c.name} <span class="tag green" style="font-size:10px;vertical-align:1px">파트너</span></b>
            <div style="font-size:12px;color:var(--ink-3);font-weight:600;margin-top:3px">${c.city} · ⭐ ${c.rating} (${c.ratingN.toLocaleString()})</div></div>
          <i class="ph-bold ph-caret-right" style="color:var(--ink-3)"></i>
        </div>`).join("")}
    </div>
  </div>`;
  stagger();
}

/* ── 조인 상세 ─────────────────────────── */
function renderPost(id) {
  const p = postById(id);
  if (!p) { location.hash = "#/home"; return; }
  const c = courseById(p.courseId);
  const host = personOf(p.hostId);
  const left = slotsLeft(p);
  const joined = S.joined.includes(p.id);
  const mine = p.hostId === "me";
  const js = joinerIds(p);
  const caddyEach = Math.round(c.caddy / p.total);
  const cartEach = Math.round(c.cart / p.total);

  appEl.innerHTML = `
  <div class="view" style="padding-bottom:120px">
    <button class="d-back" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button>
    <button class="d-share" onclick="sharePost('${p.id}')"><i class="ph-bold ph-share-network"></i></button>
    <div class="detail-hero">${courseArt(c, 0)}</div>

    <div class="float-hero-off">
      <div class="d-card in">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
          <span class="tag red">${discount(p)}% 할인</span>
          ${p.instant ? '<span class="tag green"><i class="ph-fill ph-lightning"></i>즉시확정</span>' : '<span class="tag">호스트 승인제</span>'}
          <span class="tag">${p.level}</span>
          ${p.genderPref !== "무관" ? `<span class="tag lime">${p.genderPref}</span>` : ""}
        </div>
        <div style="font-size:21px;font-weight:900;letter-spacing:-.02em">${c.name}</div>
        <div style="margin-top:6px;font-size:13.5px;color:var(--ink-2);font-weight:600">
          <i class="ph-fill ph-calendar-check" style="color:var(--green-2)"></i> ${dayLabel(p)} ${teeStr(p)} 티오프 · ${p.holes}홀
        </div>
        <div style="margin-top:4px;font-size:13.5px;color:var(--ink-2);font-weight:600">
          <i class="ph-fill ph-map-pin" style="color:var(--green-2)"></i> ${c.city} · ${c.type}
        </div>
        <div style="margin-top:14px;background:var(--green-deep);color:#fff;border-radius:14px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;font-weight:700;color:rgba(255,255,255,.7)">티오프까지</span>
          <b class="countdown" style="font-size:19px;color:var(--lime)" data-cd="${teeDate(p).getTime()}">--:--</b>
        </div>
      </div>

      <div class="d-card in">
        <h3><i class="ph-fill ph-receipt"></i>1인 비용 (총 ${p.total}인 기준)</h3>
        <div class="fee-row"><span>정상가 (그린피+캐디+카트)</span><b><del style="color:var(--ink-3);font-weight:600">${won(p.normal)}</del></b></div>
        <div class="fee-row"><span>캐디피 1/${p.total}</span><b>${won(caddyEach)} 포함</b></div>
        <div class="fee-row"><span>카트비 1/${p.total}</span><b>${won(cartEach)} 포함</b></div>
        <div class="fee-row"><span>절약되는 금액</span><b class="save">−${won(p.normal - p.price)}</b></div>
        <div class="fee-row total"><span>라스트티 조인가</span><b>${won(p.price)}</b></div>
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
      </div>

      <div class="d-card in">
        <h3><i class="ph-fill ph-golf"></i>${c.name}</h3>
        <div class="spec-grid">
          <div class="spec"><b>${c.holes}홀</b><span>규모</span></div>
          <div class="spec"><b>파 ${c.par}</b><span>레귤러</span></div>
          <div class="spec"><b>${c.len}</b><span>전장</span></div>
          <div class="spec"><b>⭐ ${c.rating}</b><span>${c.ratingN.toLocaleString()}개 평가</span></div>
        </div>
        <div class="gallery" style="margin-top:14px">
          <div class="g-shot">${courseArt(c, 0)}</div>
          <div class="g-shot">${courseArt(c, 1)}</div>
          <div class="g-shot">${courseArt(c, 2)}</div>
        </div>
        <p style="margin-top:14px;font-size:13.5px;line-height:1.65;color:var(--ink-2);font-weight:500">${c.desc}</p>
        <button class="btn btn-ghost btn-sm" style="margin-top:14px" onclick="location.hash='#/course/${c.id}'">골프장 상세 · 요금표 보기</button>
      </div>

      <div class="d-card in">
        <h3><i class="ph-fill ph-shield-check"></i>안심 조인 규칙</h3>
        <div class="info-step" style="margin-top:4px"><span class="n">✓</span><p><b>무료 취소</b>는 티오프 24시간 전까지. 이후 취소 시 조인가의 50%가 위약금으로 부과돼요.</p></div>
        <div class="info-step"><span class="n">✓</span><p><b>노쇼</b>는 그린지수가 크게 깎이고, 3회 누적 시 이용이 제한됩니다.</p></div>
        <div class="info-step"><span class="n">✓</span><p>결제는 현장에서 <b>골프장에 직접</b>. 라스트티는 자리만 연결하고 수수료를 받지 않아요. (베타)</p></div>
      </div>
    </div>
  </div>

  <div class="cta-bar">
    <div class="cta-price"><b>${won(p.price)}</b><span>${discount(p)}% 할인 · ${left}자리</span></div>
    ${mine
      ? `<button class="btn btn-danger" onclick="closeMyPost('${p.id}')">모집 마감하기</button>`
      : joined
        ? `<button class="btn btn-ghost" onclick="cancelJoin('${p.id}')">조인 취소</button>`
        : `<button class="btn btn-primary" ${left === 0 ? "disabled" : ""} onclick="askJoin('${p.id}')">${left === 0 ? "마감됐어요" : p.instant ? "바로 조인 확정하기" : "조인 신청하기"}</button>`}
  </div>`;
  stagger();
}

window.sharePost = id => {
  const p = postById(id); const c = courseById(p.courseId);
  const text = `[라스트티] ${c.name} ${dayLabel(p)} ${teeStr(p)} — ${discount(p)}% 할인 조인 (${won(p.price)})`;
  if (navigator.share) navigator.share({ title: "라스트티", text, url: location.href }).catch(() => {});
  else { navigator.clipboard?.writeText(text + " " + location.href); toast("링크가 복사됐어요", "link"); }
};

window.askJoin = id => {
  if (!S.user) { toast("조인하려면 프로필이 필요해요", "user-circle-plus"); location.hash = "#/signup"; return; }
  const p = postById(id); const c = courseById(p.courseId);
  openSheet(`
    <div style="text-align:center;padding:6px 0 2px">
      <div style="font-size:44px">⛳</div>
      <div style="font-size:19px;font-weight:900;margin-top:10px">${p.instant ? "바로 확정할까요?" : "조인을 신청할까요?"}</div>
      <p style="font-size:13.5px;color:var(--ink-2);margin-top:8px;line-height:1.6;font-weight:500">
        ${c.name} · ${dayLabel(p)} ${teeStr(p)}<br>
        <b style="font-size:16px">${won(p.price)}</b> <span style="color:var(--red);font-weight:800">(${won(p.normal - p.price)} 절약)</span>
      </p>
      <div style="background:var(--bg);border-radius:14px;padding:12px;margin-top:14px;font-size:12.5px;color:var(--ink-2);font-weight:600;text-align:left;line-height:1.6">
        · 결제는 현장에서 골프장에 직접 하시면 돼요<br>
        · 티오프 24시간 전까지 무료 취소<br>
        · 호스트에게 회원님의 프로필과 그린지수가 공개돼요
      </div>
      <button class="btn btn-primary" style="margin-top:16px" onclick="doJoin('${p.id}')">${p.instant ? "조인 확정" : "신청 보내기"}</button>
      <button class="btn btn-ghost" style="margin-top:8px" onclick="closeSheet()">다시 볼게요</button>
    </div>
  `);
};
window.doJoin = id => {
  const p = postById(id);
  if (!S.joined.includes(id)) S.joined.push(id);
  Store.save();
  closeSheet();
  toast(p.instant ? "조인 확정! 예정 라운드에 추가했어요 🎉" : "신청 완료! 호스트 승인을 기다려주세요");
  renderPost(id);
};
window.cancelJoin = id => {
  const p = postById(id);
  const hoursLeft = (teeDate(p) - Date.now()) / 3600e3;
  openSheet(`
    <div style="text-align:center;padding:6px 0 2px">
      <div style="font-size:44px">😢</div>
      <div style="font-size:19px;font-weight:900;margin-top:10px">조인을 취소할까요?</div>
      <p style="font-size:13.5px;color:var(--ink-2);margin-top:8px;font-weight:500;line-height:1.6">
        ${hoursLeft >= 24 ? "티오프 24시간 전이라 <b>무료 취소</b>예요." : `티오프까지 24시간이 안 남아<br><b style="color:var(--red)">조인가의 50% 위약금</b>이 발생해요.`}
      </p>
      <button class="btn btn-danger" style="margin-top:16px" onclick="doCancel('${id}')">취소하기</button>
      <button class="btn btn-ghost" style="margin-top:8px" onclick="closeSheet()">계속 함께할래요</button>
    </div>
  `);
};
window.doCancel = id => {
  S.joined = S.joined.filter(x => x !== id);
  Store.save(); closeSheet();
  toast("조인이 취소됐어요");
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
  const posts = postsForCourse(id);
  appEl.innerHTML = `
  <div class="view" style="padding-bottom:40px">
    <button class="d-back" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button>
    <div class="detail-hero">${courseArt(c, 1)}</div>
    <div class="float-hero-off">
      <div class="d-card in">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
          ${c.partner ? '<span class="tag green"><i class="ph-fill ph-handshake"></i>라스트티 파트너</span>' : ""}
          <span class="tag">${c.type}</span>
          ${c.tags.map(t => `<span class="tag lime">${t}</span>`).join("")}
        </div>
        <div style="font-size:22px;font-weight:900;letter-spacing:-.02em">${c.name}</div>
        <div style="font-size:12.5px;color:var(--ink-3);font-weight:600;margin-top:3px">${c.eng} · ${c.city}</div>
        <div class="spec-grid" style="margin-top:16px">
          <div class="spec"><b>${c.holes}홀</b><span>규모</span></div>
          <div class="spec"><b>파 ${c.par}</b><span>레귤러</span></div>
          <div class="spec"><b>${c.len}</b><span>전장</span></div>
          <div class="spec"><b>⭐ ${c.rating}</b><span>${c.ratingN.toLocaleString()}개 평가</span></div>
        </div>
        <p style="margin-top:16px;font-size:14px;line-height:1.7;color:var(--ink-2);font-weight:500">${c.desc}</p>
      </div>

      <div class="d-card in">
        <h3><i class="ph-fill ph-images"></i>코스 뷰</h3>
        <div class="gallery">
          <div class="g-shot">${courseArt(c, 0)}</div>
          <div class="g-shot">${courseArt(c, 1)}</div>
          <div class="g-shot">${courseArt(c, 2)}</div>
        </div>
      </div>

      <div class="d-card in">
        <h3><i class="ph-fill ph-currency-krw"></i>정상 요금표</h3>
        <div class="fee-row"><span>그린피 (주중)</span><b>${won(c.green.wd)}</b></div>
        <div class="fee-row"><span>그린피 (주말)</span><b>${won(c.green.we)}</b></div>
        <div class="fee-row"><span>캐디피 (팀당)</span><b>${won(c.caddy)}</b></div>
        <div class="fee-row"><span>카트비 (팀당)</span><b>${won(c.cart)}</b></div>
      </div>

      <div class="d-card in">
        <h3><i class="ph-fill ph-buildings"></i>시설</h3>
        <div class="facil">${c.facilities.map(f => `<span class="tag">${f}</span>`).join("")}</div>
      </div>

      <div class="d-card in">
        <h3><i class="ph-fill ph-lightning"></i>진행 중인 조인 ${posts.length ? `<span class="tag red" style="margin-left:2px">${posts.length}건</span>` : ""}</h3>
        ${posts.length ? posts.map(p => `
          <div class="map-sheet-card" style="box-shadow:none;background:var(--bg);margin-bottom:8px" onclick="location.hash='#/post/${p.id}'">
            <div style="flex:1"><b style="font-size:14px">${dayLabel(p)} ${teeStr(p)} · ${p.holes}홀</b>
            <div style="font-size:12px;color:var(--ink-3);font-weight:600;margin-top:2px">${slotsLeft(p)}자리 · ${personOf(p.hostId).name} 호스트</div></div>
            <div style="text-align:right"><b style="font-weight:900">${won(p.price)}</b><div style="font-size:11px;color:var(--red);font-weight:800">${discount(p)}%↓</div></div>
          </div>`).join("")
          : '<p style="font-size:13.5px;color:var(--ink-3);font-weight:600">지금은 열린 조인이 없어요. 첫 모집을 올려보세요!</p>'}
        <button class="btn btn-primary" style="margin-top:12px" onclick="location.hash='#/new'">이 골프장에서 모집 올리기</button>
      </div>
    </div>
  </div>`;
  stagger();
}

/* ── 모집 올리기 ────────────────────────── */
function renderNew() {
  if (!S.user) { toast("모집을 올리려면 프로필이 필요해요", "user-circle-plus"); location.hash = "#/signup"; return; }
  const st = { courseId: COURSES[0].id, day: 0, tee: "07:30", holes: 18, slots: 1, normal: 280000, price: 170000, tags: [], level: "누구나", memo: "" };
  appEl.innerHTML = `
  <div class="view form-page" style="padding-bottom:120px">
    <div style="display:flex;align-items:center;gap:12px">
      <button style="width:38px;height:38px;border-radius:13px;background:var(--card);box-shadow:var(--shadow-sm);display:flex;align-items:center;justify-content:center" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button>
      <h1 style="margin:0;font-size:22px">빈자리 모집 올리기</h1>
    </div>
    <p style="margin-top:10px;font-size:13.5px;color:var(--ink-2);font-weight:500;line-height:1.6">일행이 취소됐나요? 위약금 대신 빈자리를 할인가로 양도하세요. 평균 <b>30분 안에</b> 채워집니다.</p>

    <label class="f-label">골프장</label>
    <div class="f-input"><i class="ph ph-golf" style="color:var(--ink-3)"></i>
      <select id="np-course">${COURSES.map(c => `<option value="${c.id}">${c.name} — ${c.city}</option>`).join("")}</select></div>

    <label class="f-label">날짜</label>
    <div class="seg" id="np-day">${[0, 1, 2, 3, 4].map(d => { const dt = new Date(BOOT.getFullYear(), BOOT.getMonth(), BOOT.getDate() + d); const nm = d === 0 ? "오늘" : d === 1 ? "내일" : `${dt.getMonth() + 1}.${dt.getDate()}`; return `<button class="${d === 0 ? "on" : ""}" data-v="${d}">${nm}<br><span style="font-size:10.5px;opacity:.7">${DOW[dt.getDay()]}요일</span></button>`; }).join("")}</div>

    <label class="f-label">티오프 시간 · 홀</label>
    <div style="display:flex;gap:8px">
      <div class="f-input" style="flex:1"><i class="ph ph-clock" style="color:var(--ink-3)"></i><input type="time" id="np-tee" value="07:30"></div>
      <div class="seg" id="np-holes">${[9, 18, 36].map(h => `<button class="${h === 18 ? "on" : ""}" data-v="${h}">${h}홀</button>`).join("")}</div>
    </div>

    <label class="f-label">채워야 할 자리</label>
    <div class="seg" id="np-slots">${[1, 2, 3].map(n => `<button class="${n === 1 ? "on" : ""}" data-v="${n}">${n}명</button>`).join("")}</div>

    <label class="f-label">1인 비용</label>
    <div style="display:flex;gap:8px">
      <div style="flex:1"><div style="font-size:11px;font-weight:800;color:var(--ink-3);margin-bottom:5px">정상가</div>
        <div class="f-input"><input type="number" id="np-normal" value="280000" inputmode="numeric"></div></div>
      <div style="flex:1"><div style="font-size:11px;font-weight:800;color:var(--ink-3);margin-bottom:5px">조인가 (할인)</div>
        <div class="f-input" style="border-color:var(--green)"><input type="number" id="np-price" value="170000" inputmode="numeric"></div></div>
    </div>
    <div id="np-off" style="margin-top:10px;text-align:center;font-size:14px;font-weight:800;color:var(--green-2)">39% 할인 — 좋은 가격이에요! 금방 채워질 거예요</div>

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
  });
  seg("#np-day", "day", true); seg("#np-holes", "holes", true); seg("#np-slots", "slots", true); seg("#np-level", "level");
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
    if (off >= 30) { el.style.color = "var(--green-2)"; el.textContent = `${off}% 할인 — 좋은 가격이에요! 금방 채워질 거예요`; }
    else if (off > 0) { el.style.color = "var(--amber)"; el.textContent = `${off}% 할인 — 30% 이상이면 평균 30분 내 매칭돼요`; }
    else { el.style.color = "var(--red)"; el.textContent = "조인가는 정상가보다 낮아야 해요"; }
  };
  $("#np-normal").addEventListener("input", offCalc);
  $("#np-price").addEventListener("input", offCalc);
  $("#np-go").addEventListener("click", () => {
    st.courseId = $("#np-course").value;
    st.tee = $("#np-tee").value || "07:30";
    st.memo = $("#np-memo").value.trim() || "매너 좋은 분이면 누구나 환영합니다!";
    offCalc();
    if (st.price <= 0 || st.price >= st.normal) { toast("조인가를 확인해주세요", "warning"); return; }
    const post = {
      id: "mp" + Date.now(), courseId: st.courseId, hostId: "me", day: st.day, tee: st.tee,
      holes: st.holes, total: 4, joiners: ["me"], normal: st.normal, price: st.price,
      reason: "일행 취소", instant: true, level: st.level, tags: st.tags.length ? st.tags : ["매너중시"],
      genderPref: "무관", memo: st.memo, ago: "방금 전",
    };
    S.myPosts.push(post);
    Store.save();
    toast("모집이 올라갔어요! 신청이 오면 알려드릴게요 📣");
    location.hash = "#/post/" + post.id;
  });
}

/* ── 크루 ─────────────────────────────── */
function crewCard(cr) {
  const joined = S.crews.includes(cr.id);
  return `
  <div class="crew-card in" onclick="location.hash='#/crew/${cr.id}'">
    <div class="crew-cover" style="background:${cr.cover}">${cr.emoji}</div>
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
    <p class="px" style="font-size:13.5px;color:var(--ink-2);font-weight:500;line-height:1.6;margin-bottom:16px">조인으로 만난 사이가 크루가 됩니다. 정기 라운드, 번개, 원정까지 — 혼자 치는 골프는 이제 그만.</p>
    <div class="px">${CREWS.map(crewCard).join("")}</div>
    <div class="px" style="margin-top:8px">
      <div class="partner-card in"><div class="ic">🏌️</div><b>나만의 크루 만들기</b><p>정기 멤버가 4명 이상이면 크루를 개설할 수 있어요.<br>크루 전용 조인과 단체 할인이 제공됩니다.</p>
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
    <div class="detail-hero" style="height:190px;background:${cr.cover};display:flex;align-items:center;justify-content:center;font-size:76px">${cr.emoji}</div>
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
            <div class="av g${f.g}">${f.avatar}</div>
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
  else { S.crews.push(id); toast("크루 가입 완료! 피드에 인사를 남겨보세요 👋"); }
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

/* ── 프로필 (나 / 호스트) ─────────────────── */
function renderMe() {
  if (!S.user) {
    appEl.innerHTML = `
    <div class="view"><div class="empty" style="padding-top:110px">
      <span class="big">🏌️</span><b>아직 프로필이 없어요</b>
      <p>프로필을 만들면 조인 신청, 모집 올리기,<br>그린지수 관리까지 전부 열려요.</p>
      <button class="btn btn-primary" style="margin-top:22px;max-width:260px;margin-left:auto;margin-right:auto" onclick="location.hash='#/signup'">1분 만에 프로필 만들기</button>
    </div></div>`;
    return;
  }
  const u = S.user;
  const upcoming = S.joined.map(postById).filter(Boolean).filter(p => teeDate(p) > new Date(Date.now() - 6 * 3600e3)).sort((a, b) => teeDate(a) - teeDate(b));
  const myPosts = S.myPosts.filter(p => !S.closed.includes(p.id));
  const saved = S.joined.map(postById).filter(Boolean).reduce((s, p) => s + (p.normal - p.price), 0);
  appEl.innerHTML = `
  <div class="view">
    <div class="prof-hero">
      <div class="prof-av av g${u.g}">${u.avatar}</div>
      <div class="prof-name">${u.nick}</div>
      <div class="prof-sub">${u.career} · 평균 ${u.avg}타 · ${u.region}</div>
      ${u.verified ? '<span class="verified"><i class="ph-fill ph-seal-check"></i>본인인증 완료</span>' : ""}
    </div>
    <div class="stat-row in">
      <div class="stat-cell"><b>${S.joined.length}</b><span>조인 라운드</span></div>
      <div class="stat-cell"><b>5.0</b><span>그린지수</span></div>
      <div class="stat-cell"><b>${saved > 0 ? won(saved) : "₩0"}</b><span>총 절약</span></div>
    </div>

    <div class="h-sec px"><h2>내 뱃지</h2></div>
    <div class="px"><div class="badge-scroll in">
      <span class="badge-pill">🌱 라스트티 새싹</span>
      ${u.verified ? '<span class="badge-pill">✅ 본인인증</span>' : ""}
      ${S.joined.length > 0 ? '<span class="badge-pill">⛳ 첫 조인 완료</span>' : ""}
      ${S.crews.length > 0 ? '<span class="badge-pill">🤝 크루 멤버</span>' : ""}
      ${(u.styles || []).map(s => `<span class="badge-pill">🏷️ ${s}</span>`).join("")}
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
        : `<div class="empty" style="padding:30px"><b>아직 예정된 라운드가 없어요</b><p>지금 열린 조인을 둘러보세요!</p><button class="btn btn-lime btn-sm" style="margin:14px auto 0" onclick="location.hash='#/home'">빈자리 보러가기</button></div>`}
    </div>

    ${myPosts.length ? `
    <div class="h-sec px"><h2>내가 올린 모집</h2></div>
    <div class="px">${myPosts.map(postCard).join("")}</div>` : ""}

    <div class="h-sec px"><h2>받은 후기</h2></div>
    <div class="px"><div class="d-card in" style="margin:0">
      <div class="empty" style="padding:16px"><b>첫 라운드 후 후기가 쌓여요</b><p>라운드가 끝나면 동반자들이 서로 그린지수와<br>후기를 남겨 신뢰를 쌓아갑니다.</p></div>
    </div></div>

    <div class="h-sec px"><h2>설정</h2></div>
    <div class="px" style="background:var(--card);border-radius:var(--r-md);padding:4px 16px;box-shadow:var(--shadow-sm)">
      <button class="menu-row" onclick="location.hash='#/signup'"><i class="ph-fill ph-user-gear"></i>프로필 수정<i class="ph-bold ph-caret-right"></i></button>
      <button class="menu-row" onclick="location.hash='#/alerts'"><i class="ph-fill ph-bell-ringing"></i>알림<i class="ph-bold ph-caret-right"></i></button>
      <button class="menu-row" onclick="toast('제휴 문의가 접수됐어요!','handshake')"><i class="ph-fill ph-handshake"></i>골프장 제휴 문의<i class="ph-bold ph-caret-right"></i></button>
      <button class="menu-row" style="border-bottom:0;color:var(--red)" onclick="resetAll()"><i class="ph-fill ph-sign-out" style="color:var(--red)"></i>로그아웃 (데이터 초기화)<i class="ph-bold ph-caret-right"></i></button>
    </div>
  </div>`;
  stagger();
}
window.resetAll = () => {
  openSheet(`
    <div style="text-align:center;padding:6px 0 2px">
      <div style="font-size:44px">👋</div>
      <div style="font-size:19px;font-weight:900;margin-top:10px">로그아웃할까요?</div>
      <p style="font-size:13.5px;color:var(--ink-2);margin-top:8px;font-weight:500">프로필, 조인 내역, 크루 가입이 모두 초기화돼요.</p>
      <button class="btn btn-danger" style="margin-top:16px" onclick="localStorage.removeItem(Store.key);location.reload()">로그아웃</button>
      <button class="btn btn-ghost" style="margin-top:8px" onclick="closeSheet()">취소</button>
    </div>`);
};

function renderUser(id) {
  const h = hostById(id);
  if (!h) { location.hash = "#/home"; return; }
  const their = openPosts().filter(p => p.hostId === id);
  appEl.innerHTML = `
  <div class="view">
    <button class="d-back" onclick="history.back()"><i class="ph-bold ph-arrow-left"></i></button>
    <div class="prof-hero">
      <div class="prof-av av g${h.g}">${h.avatar}</div>
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
    </div></div>
    <div class="h-sec px"><h2>뱃지</h2></div>
    <div class="px"><div class="badge-scroll in">${h.badges.map(b => `<span class="badge-pill">🏅 ${b}</span>`).join("")}</div></div>
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
      ${NOTIFS.map(n => `<div class="notif-row in"><div class="ic">${n.icon}</div><div><b>${n.title}</b><p>${n.body}</p><span>${n.when}</span></div></div>`).join("")}
    </div>
  </div>`;
  stagger();
}

/* ══════════ 라우터 ══════════ */
const TAB_ROUTES = ["#/home", "#/map", "#/new", "#/crew", "#/me"];
function render() {
  const hash = location.hash || "#/home";
  const [_, route, param] = hash.split("/");
  window.scrollTo(0, 0);
  closeSheet();

  const tabbar = $("#tabbar");
  const hideTab = ["ob", "signup", "post", "course", "user", "new"].includes(route);
  tabbar.classList.toggle("hidden", hideTab);
  $$("#tabbar .tab").forEach(t => t.classList.toggle("active", t.dataset.route === "#/" + route));

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
