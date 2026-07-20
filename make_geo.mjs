// 실제 한국 지형 경로 + 골프장 좌표 생성 → geo.js
// node make_geo.mjs
const COURSES = [
  { id: "sky72", q: "클럽72 골프장 인천", fb: [37.449, 126.470] },
  { id: "bearcreek", q: "베어크리크 골프클럽 포천", fb: [38.060, 127.270] },
  { id: "lakeside", q: "레이크사이드 컨트리클럽 용인", fb: [37.291, 127.176] },
  { id: "wellington", q: "웰링턴 컨트리클럽 이천", fb: [37.187, 127.457] },
  { id: "oakvalley", q: "오크밸리 골프 원주", fb: [37.402, 127.813] },
  { id: "seolhaeone", q: "설해원 양양", fb: [38.040, 128.620] },
  { id: "goldenbay", q: "골든베이 골프 태안", fb: [36.750, 126.200] },
  { id: "silkriver", q: "실크리버 컨트리클럽 청주", fb: [36.620, 127.360] },
  { id: "bluoneship", q: "블루원 상주 골프", fb: [36.440, 128.140] },
  { id: "southcape", q: "사우스케이프 남해", fb: [34.830, 128.060] },
  { id: "asiad", q: "아시아드 컨트리클럽 부산", fb: [35.330, 129.160] },
  { id: "mooan", q: "무안 컨트리클럽", fb: [34.930, 126.450] },
  { id: "pinebeach", q: "파인비치 골프링크스 해남", fb: [34.630, 126.240] },
  { id: "pinx", q: "핀크스 골프클럽 제주", fb: [33.300, 126.370] },
  { id: "ora", q: "오라 컨트리클럽 제주", fb: [33.460, 126.520] },
];

const GJ_URLS = [
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json/skorea_provinces_geo_simple.json",
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-geo.json",
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/gadm/json/skorea_provinces_geo_simple.json",
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// RDP 단순화
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  let dmax = 0, idx = 0;
  const [x1, y1] = pts[0], [x2, y2] = pts[pts.length - 1];
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1e-9;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / len;
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax > eps) {
    return rdp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(rdp(pts.slice(idx), eps));
  }
  return [pts[0], pts[pts.length - 1]];
}

async function main() {
  // 1) 지오코딩: Overpass로 주변 15km 내 leisure=golf_course 폴리곤 검색 (이름 매칭 우선, 없으면 최근접)
  const coords = {};
  const kw = {
    sky72: ["스카이", "sky", "클럽72", "72"], bearcreek: ["베어", "bear"], lakeside: ["레이크사이드", "lakeside"],
    wellington: ["웰링턴", "wellington"], oakvalley: ["오크밸리", "oak"], seolhaeone: ["설해원", "골든비치"],
    goldenbay: ["골든베이", "golden"], silkriver: ["실크리버", "silk"], bluoneship: ["블루원", "blue"],
    southcape: ["사우스케이프", "south cape", "southcape"], asiad: ["아시아드", "asiad"], mooan: ["무안"],
    pinebeach: ["파인비치", "pine beach"], pinx: ["핀크스", "pinx"], ora: ["오라", "ora"],
  };
  for (const c of COURSES) {
    let hit = null;
    const EPS = ["https://overpass.kumi.systems/api/interpreter", "https://overpass-api.de/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
    for (const ep of EPS) {
      if (hit) break;
      try {
      const q = `[out:json][timeout:25];(way["leisure"="golf_course"](around:15000,${c.fb[0]},${c.fb[1]});relation["leisure"="golf_course"](around:15000,${c.fb[0]},${c.fb[1]}););out center tags;`;
      const res = await fetch(ep, {
        method: "POST", body: "data=" + encodeURIComponent(q),
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "lasttee-build/1.0" },
      });
      const js = await res.json();
      const els = (js.elements || []).map(e => ({
        lat: e.center ? e.center.lat : e.lat, lng: e.center ? e.center.lon : e.lon,
        name: (e.tags && (e.tags["name:ko"] || e.tags.name || e.tags["name:en"])) || "",
      })).filter(e => e.lat);
      const kws = kw[c.id] || [];
      let m = els.find(e => kws.some(k => e.name.toLowerCase().includes(k.toLowerCase())));
      if (!m && els.length) m = els.sort((a, b) => dist([a.lat, a.lng], c.fb) - dist([b.lat, b.lng], c.fb))[0];
      if (m) hit = { lat: m.lat, lng: m.lng, addr: "", src: m.name ? "osm:" + m.name : "osm:nearest" };
      } catch (e) { console.log(`  !! ${c.id}@${ep.split("/")[2]}: ${e.message.slice(0, 40)}`); await sleep(2000); }
    }
    coords[c.id] = hit || { lat: c.fb[0], lng: c.fb[1], addr: "", src: "fb" };
    console.log(`${c.id}: ${coords[c.id].lat.toFixed(4)},${coords[c.id].lng.toFixed(4)} [${coords[c.id].src}]`);
    await sleep(2500);
  }

  // 2) 한국 GeoJSON
  let gj = null;
  for (const u of GJ_URLS) {
    try {
      const res = await fetch(u);
      if (res.ok) { gj = await res.json(); console.log("geojson OK:", u); break; }
      console.log("geojson", res.status, u);
    } catch (e) { console.log("geojson err", u, e.message); }
  }
  if (!gj) throw new Error("no geojson");

  // 3) 투영 (equirect + cos 보정)
  const minLng = 125.7, maxLng = 129.8, minLat = 33.0, maxLat = 38.75;
  const W = 400;
  const k = Math.cos((36 * Math.PI) / 180);
  const H = ((maxLat - minLat) / ((maxLng - minLng) * k)) * W;
  const px = lng => ((lng - minLng) / (maxLng - minLng)) * W;
  const py = lat => ((maxLat - lat) / (maxLat - minLat)) * H;

  // 4) 폴리곤 → path (섬 필터 + 단순화)
  const paths = [];
  let kept = 0, dropped = 0;
  for (const f of gj.features) {
    const geoms = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
    let d = "";
    for (const poly of geoms) {
      const ring = poly[0];
      const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]);
      const diag = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      if (diag < 0.13) { dropped++; continue; } // 아주 작은 섬 제거
      kept++;
      let pts = ring.map(p => [px(p[0]), py(p[1])]);
      // 닫힌 링(첫점=끝점)은 RDP 기준선이 퇴화하므로 끝점 제거 후 처리
      if (pts.length > 2 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts = pts.slice(0, -1);
      const mid = Math.floor(pts.length / 2);
      pts = rdp(pts.slice(0, mid + 1), 0.55).slice(0, -1).concat(rdp(pts.slice(mid), 0.55));
      if (pts.length < 4) continue;
      d += "M" + pts.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "Z";
    }
    if (d) paths.push(d);
  }
  console.log(`rings kept ${kept} dropped ${dropped}, provinces ${paths.length}`);

  const courseOut = Object.fromEntries(Object.entries(coords).map(([id, c]) => {
    const shortAddr = c.addr ? c.addr.split(",").slice(0, 4).map(s => s.trim()).reverse().filter(s => !/대한민국|^\d{5}$/.test(s)).join(" ") : "";
    return [id, { lat: +c.lat.toFixed(5), lng: +c.lng.toFixed(5), mx: +px(c.lng).toFixed(1), my: +py(c.lat).toFixed(1), addr: shortAddr }];
  }));

  const out = `/* 자동 생성: make_geo.mjs (실제 한국 행정경계 + 골프장 좌표) */
const GEO = { W: ${W}, H: ${H.toFixed(1)}, minLng: ${minLng}, maxLng: ${maxLng}, minLat: ${minLat}, maxLat: ${maxLat} };
const KOREA_PATHS = ${JSON.stringify(paths)};
const COURSE_GEO = ${JSON.stringify(courseOut, null, 0)};
`;
  const fs = await import("fs");
  fs.writeFileSync(new URL("./geo.js", import.meta.url), out);
  console.log("geo.js written:", out.length, "bytes, viewBox 0 0", W, H.toFixed(1));
}
main();
