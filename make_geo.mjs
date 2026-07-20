// 실제 한국 지형 경로 + 골프장 좌표 생성 → geo.js
// node make_geo.mjs
const COURSES = [
  { id: "sky72", q: "클럽72", fb: [37.449, 126.470] },
  { id: "bearcreek", q: "베어크리크 포천", fb: [38.060, 127.270] },
  { id: "lakeside", q: "레이크사이드 용인", fb: [37.291, 127.176] },
  { id: "wellington", q: "웰링턴 이천", fb: [37.187, 127.457] },
  { id: "oakvalley", q: "오크밸리 원주", fb: [37.402, 127.813] },
  { id: "seolhaeone", q: "설해원 양양", fb: [38.040, 128.620] },
  { id: "goldenbay", q: "골든베이 태안", fb: [36.750, 126.200] },
  { id: "silkriver", q: "실크리버 청주", fb: [36.620, 127.360] },
  { id: "bluoneship", q: "블루원 상주", fb: [36.440, 128.140] },
  { id: "southcape", q: "사우스케이프 남해", fb: [34.830, 128.060] },
  { id: "asiad", q: "아시아드 부산", fb: [35.330, 129.160] },
  { id: "mooan", q: "무안CC", fb: [34.930, 126.450] },
  { id: "pinebeach", q: "파인비치 해남", fb: [34.630, 126.240] },
  { id: "pinx", q: "핀크스 제주", fb: [33.300, 126.370] },
  { id: "ora", q: "오라CC 제주", fb: [33.460, 126.520] },
  // v1.3 추가
  { id: "namseoul", q: "남서울CC", fb: [37.360, 127.070] },
  { id: "anyang", q: "안양CC", fb: [37.327, 126.955] },
  { id: "hanyang", q: "한양CC 고양", fb: [37.620, 126.850] },
  { id: "newkorea", q: "뉴코리아CC 고양", fb: [37.640, 126.800] },
  { id: "cc88", q: "88CC 용인", fb: [37.240, 127.150] },
  { id: "giheung", q: "기흥CC 용인", fb: [37.240, 127.110] },
  { id: "asiana", q: "아시아나CC 용인", fb: [37.230, 127.240] },
  { id: "hwasan", q: "화산CC 용인", fb: [37.200, 127.250] },
  { id: "rexfield", q: "렉스필드 여주", fb: [37.270, 127.550] },
  { id: "haesley", q: "해슬리 나인브릿지", fb: [37.360, 127.580] },
  { id: "ferrum", q: "페럼클럽 여주", fb: [37.320, 127.620] },
  { id: "solmoro", q: "솔모로 여주", fb: [37.260, 127.600] },
  { id: "eastvalley", q: "이스트밸리 광주", fb: [37.350, 127.320] },
  { id: "namchon", q: "남촌CC 광주", fb: [37.360, 127.280] },
  { id: "seowonvalley", q: "서원밸리 파주", fb: [37.800, 126.850] },
  { id: "lakewood", q: "레이크우드 양주", fb: [37.800, 127.020] },
  { id: "jisan", q: "지산CC 이천", fb: [37.210, 127.390] },
  { id: "high1", q: "하이원CC 정선", fb: [37.200, 128.830] },
  { id: "sagewood", q: "세이지우드 홍천", fb: [37.620, 127.950] },
  { id: "laviebelle", q: "라비에벨 춘천", fb: [37.770, 127.650] },
  { id: "jadepalace", q: "제이드팰리스", fb: [37.800, 127.550] },
  { id: "woojeong", q: "우정힐스 천안", fb: [36.750, 127.250] },
  { id: "tgv", q: "떼제베CC 청주", fb: [36.720, 127.430] },
  { id: "gunsan", q: "군산CC", fb: [35.900, 126.780] },
  { id: "seungju", q: "승주CC 순천", fb: [34.950, 127.350] },
  { id: "tongdo", q: "통도 파인이스트 양산", fb: [35.480, 129.070] },
  { id: "gaya", q: "가야CC 김해", fb: [35.320, 128.830] },
  { id: "silla", q: "신라CC 경주", fb: [35.780, 129.330] },
  { id: "maunaocean", q: "마우나오션 경주", fb: [35.700, 129.340] },
  { id: "dianus", q: "블루원 디아너스 경주", fb: [35.750, 129.300] },
  { id: "oceanhills", q: "오션힐스 포항", fb: [36.050, 129.320] },
  { id: "palgong", q: "팔공CC 대구", fb: [36.020, 128.700] },
  { id: "ninebridges", q: "클럽 나인브릿지 제주", fb: [33.320, 126.420] },
  { id: "skyhill", q: "롯데스카이힐 제주", fb: [33.320, 126.510] },
  { id: "teddyvalley", q: "테디밸리 제주", fb: [33.290, 126.350] },
  { id: "laon", q: "라온 골프클럽 제주", fb: [33.350, 126.280] },
  { id: "blackstone", q: "블랙스톤 제주", fb: [33.360, 126.310] },
  { id: "elysian", q: "엘리시안 제주", fb: [33.450, 126.650] },
  { id: "haevichi", q: "해비치 제주", fb: [33.360, 126.800] },
];

const KW = {
  sky72: ["스카이", "sky", "클럽72", "72"], bearcreek: ["베어", "bear"], lakeside: ["레이크사이드", "lakeside"],
  wellington: ["웰링턴", "wellington"], oakvalley: ["오크밸리", "oak"], seolhaeone: ["설해원", "골든비치"],
  goldenbay: ["골든베이", "golden"], silkriver: ["실크리버", "silk"], bluoneship: ["블루원", "blue"],
  southcape: ["사우스케이프", "south cape", "southcape"], asiad: ["아시아드", "asiad"], mooan: ["무안"],
  pinebeach: ["파인비치", "pine beach"], pinx: ["핀크스", "pinx"], ora: ["오라", "ora"],
  namseoul: ["남서울"], anyang: ["안양"], hanyang: ["한양"], newkorea: ["뉴코리아", "new korea"],
  cc88: ["88"], giheung: ["기흥"], asiana: ["아시아나", "asiana"], hwasan: ["화산"],
  rexfield: ["렉스필드", "rex"], haesley: ["해슬리", "haesley"], ferrum: ["페럼", "ferrum"],
  solmoro: ["솔모로", "solmoro"], eastvalley: ["이스트밸리", "east valley"], namchon: ["남촌"],
  seowonvalley: ["서원", "seowon"], lakewood: ["레이크우드", "lakewood"], jisan: ["지산"],
  high1: ["하이원", "high1", "high 1"], sagewood: ["세이지우드", "sage"], laviebelle: ["라비에벨", "la vie"],
  jadepalace: ["제이드", "jade"], woojeong: ["우정힐스", "woo jung", "woojeong"], tgv: ["떼제베", "tgv"],
  gunsan: ["군산"], seungju: ["승주"], tongdo: ["통도", "파인이스트"], gaya: ["가야"],
  silla: ["신라"], maunaocean: ["마우나", "mauna"], dianus: ["디아너스", "블루원"],
  oceanhills: ["오션힐스", "ocean hills"], palgong: ["팔공"], ninebridges: ["나인브릿지", "nine bridges"],
  skyhill: ["스카이힐", "롯데", "sky hill"], teddyvalley: ["테디", "teddy"], laon: ["라온", "laon"],
  blackstone: ["블랙스톤", "black stone", "blackstone"], elysian: ["엘리시안", "elysian"], haevichi: ["해비치", "haevichi"],
};

const GJ_URLS = [
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json/skorea_provinces_geo_simple.json",
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

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
  const coords = {};
  const EPS = ["https://overpass.kumi.systems/api/interpreter", "https://overpass-api.de/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
  for (const c of COURSES) {
    let hit = null;
    for (const ep of EPS) {
      if (hit) break;
      try {
        const q = `[out:json][timeout:20];(way["leisure"="golf_course"](around:14000,${c.fb[0]},${c.fb[1]});relation["leisure"="golf_course"](around:14000,${c.fb[0]},${c.fb[1]}););out center tags;`;
        const res = await fetch(ep, {
          method: "POST", body: "data=" + encodeURIComponent(q),
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "lasttee-build/1.0" },
        });
        const js = await res.json();
        const els = (js.elements || []).map(e => ({
          lat: e.center ? e.center.lat : e.lat, lng: e.center ? e.center.lon : e.lon,
          name: (e.tags && (e.tags["name:ko"] || e.tags.name || e.tags["name:en"])) || "",
        })).filter(e => e.lat);
        const kws = KW[c.id] || [];
        let m = els.find(e => kws.some(k => e.name.toLowerCase().includes(k.toLowerCase())));
        if (!m && els.length) m = els.sort((a, b) => dist([a.lat, a.lng], c.fb) - dist([b.lat, b.lng], c.fb))[0];
        if (m) hit = { lat: m.lat, lng: m.lng, src: m.name ? "osm:" + m.name : "osm:nearest" };
      } catch (e) { await sleep(1500); }
    }
    coords[c.id] = hit || { lat: c.fb[0], lng: c.fb[1], src: "fb" };
    console.log(`${c.id}: ${coords[c.id].lat.toFixed(4)},${coords[c.id].lng.toFixed(4)} [${coords[c.id].src}]`);
    await sleep(1300);
  }

  let gj = null;
  for (const u of GJ_URLS) {
    try {
      const res = await fetch(u);
      if (res.ok) { gj = await res.json(); break; }
    } catch (e) {}
  }
  if (!gj) throw new Error("no geojson");

  const minLng = 125.7, maxLng = 129.8, minLat = 33.0, maxLat = 38.75;
  const W = 400;
  const k = Math.cos((36 * Math.PI) / 180);
  const H = ((maxLat - minLat) / ((maxLng - minLng) * k)) * W;
  const px = lng => ((lng - minLng) / (maxLng - minLng)) * W;
  const py = lat => ((maxLat - lat) / (maxLat - minLat)) * H;

  const paths = [];
  for (const f of gj.features) {
    const geoms = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
    let d = "";
    for (const poly of geoms) {
      const ring = poly[0];
      const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]);
      const diag = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      if (diag < 0.13) continue;
      let pts = ring.map(p => [px(p[0]), py(p[1])]);
      if (pts.length > 2 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts = pts.slice(0, -1);
      const mid = Math.floor(pts.length / 2);
      pts = rdp(pts.slice(0, mid + 1), 0.55).slice(0, -1).concat(rdp(pts.slice(mid), 0.55));
      if (pts.length < 4) continue;
      d += "M" + pts.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "Z";
    }
    if (d) paths.push(d);
  }
  console.log(`provinces ${paths.length}`);

  const courseOut = Object.fromEntries(Object.entries(coords).map(([id, c]) => {
    return [id, { lat: +c.lat.toFixed(5), lng: +c.lng.toFixed(5), mx: +px(c.lng).toFixed(1), my: +py(c.lat).toFixed(1), addr: "" }];
  }));

  const out = `/* 자동 생성: make_geo.mjs (실제 한국 행정경계 + 골프장 좌표) */
const GEO = { W: ${W}, H: ${H.toFixed(1)}, minLng: ${minLng}, maxLng: ${maxLng}, minLat: ${minLat}, maxLat: ${maxLat} };
const KOREA_PATHS = ${JSON.stringify(paths)};
const COURSE_GEO = ${JSON.stringify(courseOut, null, 0)};
`;
  const fs = await import("fs");
  fs.writeFileSync(new URL("./geo.js", import.meta.url), out);
  console.log("geo.js written:", out.length, "bytes");
}
main();
