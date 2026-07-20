// 전국 골프장 + 스크린골프 + 연습장 디렉토리 수집 → venues.js
// OSM Overpass: 실명 + 실좌표만 수집, 기존 큐레이션 데이터와 중복 제거
import fs from "fs";

const EPS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function overpass(q, label) {
  for (const ep of EPS) {
    try {
      console.log(`[${label}] ${ep.split("/")[2]} ...`);
      const res = await fetch(ep, {
        method: "POST", body: "data=" + encodeURIComponent(q),
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "lasttee-build/1.0" },
      });
      if (!res.ok) { console.log(`  http ${res.status}`); await sleep(3000); continue; }
      const js = await res.json();
      console.log(`  → ${js.elements ? js.elements.length : 0} elements`);
      return js.elements || [];
    } catch (e) { console.log(`  err ${e.message.slice(0, 60)}`); await sleep(3000); }
  }
  return [];
}

const el2v = e => ({
  name: (e.tags && (e.tags["name:ko"] || e.tags.name)) || "",
  lat: e.center ? e.center.lat : e.lat,
  lng: e.center ? e.center.lon : e.lon,
  city: (e.tags && (e.tags["addr:city"] || e.tags["addr:province"])) || "",
  holes: (e.tags && e.tags["golf:holes"]) || "",
});

function main() {}

(async () => {
  // 1) 전국 필드 골프장 (leisure=golf_course)
  const qField = `[out:json][timeout:120];area["ISO3166-1"="KR"][admin_level=2]->.kr;(way["leisure"="golf_course"](area.kr);relation["leisure"="golf_course"](area.kr););out center tags;`;
  const fieldEls = await overpass(qField, "field");
  await sleep(4000);

  // 2) 스크린골프 (이름 기반: 골프존/프렌즈/스크린/티업/SG골프)
  const qScreen = `[out:json][timeout:120];area["ISO3166-1"="KR"][admin_level=2]->.kr;(nwr["name"~"골프존|프렌즈 ?스크린|스크린 ?골프|티업비전|SG ?골프",i](area.kr););out center tags;`;
  const screenEls = await overpass(qScreen, "screen");
  await sleep(4000);

  // 3) 골프연습장 (driving range 태그 + 이름)
  const qRange = `[out:json][timeout:120];area["ISO3166-1"="KR"][admin_level=2]->.kr;(nwr["golf"="driving_range"](area.kr);nwr["leisure"="golf_course"]["name"~"연습장"](area.kr);nwr["name"~"골프연습장|드라이빙 ?레인지",i](area.kr););out center tags;`;
  const rangeEls = await overpass(qRange, "range");

  // 4) 도 경계 (지역 분류용)
  const gj = await (await fetch("https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json/skorea_provinces_geo_simple.json")).json();
  const provs = gj.features.map(f => ({
    name: f.properties.name || f.properties.name_eng || "",
    polys: (f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates]).map(p => p[0]),
  }));
  const inRing = (lng, lat, ring) => {
    let c = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const REGION = {
    "서울특별시": "수도권", "인천광역시": "수도권", "경기도": "수도권",
    "강원도": "강원", "강원특별자치도": "강원",
    "충청북도": "충청", "충청남도": "충청", "대전광역시": "충청", "세종특별자치시": "충청",
    "전라북도": "호남", "전북특별자치도": "호남", "전라남도": "호남", "광주광역시": "호남",
    "경상북도": "영남", "경상남도": "영남", "대구광역시": "영남", "부산광역시": "영남", "울산광역시": "영남",
    "제주특별자치도": "제주", "제주도": "제주",
  };
  const regionOf = (lat, lng) => {
    for (const p of provs) for (const ring of p.polys) if (inRing(lng, lat, ring)) return { prov: p.name, region: REGION[p.name] || "" };
    // 경계 밖(해안 단순화 오차): 최근접 도
    let best = null, bd = 1e9;
    for (const p of provs) for (const ring of p.polys) for (const pt of ring) {
      const d = (pt[0] - lng) ** 2 + (pt[1] - lat) ** 2;
      if (d < bd) { bd = d; best = p.name; }
    }
    return { prov: best || "", region: REGION[best] || "" };
  };

  // 5) 기존 큐레이션 좌표 (중복 제거용): data.js + geo.js에서 추출
  const dataSrc = fs.readFileSync(new URL("./data.js", import.meta.url), "utf8");
  const geoSrc = fs.readFileSync(new URL("./geo.js", import.meta.url), "utf8");
  const cur = [];
  for (const m of dataSrc.matchAll(/lat: ([\d.]+), lng: ([\d.]+)/g)) cur.push([+m[1], +m[2]]);
  for (const m of geoSrc.matchAll(/"lat":([\d.]+),"lng":([\d.]+)/g)) cur.push([+m[1], +m[2]]);
  console.log("curated coords:", cur.length);
  const nearCurated = (lat, lng, km = 2.0) => cur.some(([a, b]) => Math.hypot((a - lat) * 111, (b - lng) * 88) < km);

  // 6) 정제 + 분류
  const clean = s => s.replace(/\s+/g, " ").trim();
  const seen = [];
  const nearSeen = (lat, lng, name, km = 1.2) => seen.some(v => v.n === name && Math.hypot((v.lat - lat) * 111, (v.lng - lng) * 88) < km);
  const out = [];
  const push = (e, kind) => {
    const v = el2v(e);
    if (!v.name || !v.lat) return;
    let n = clean(v.name);
    if (n.length < 2 || n.length > 30) return;
    if (/골프텔|골프샵|골프백화점|골프의류|중고|공사|예정/.test(n)) return;
    if (nearSeen(v.lat, v.lng, n)) return;
    if (kind === "f" && nearCurated(v.lat, v.lng)) return;
    if (kind !== "f" && nearCurated(v.lat, v.lng, 0.25)) return;
    const { region } = regionOf(v.lat, v.lng);
    if (!region) return;
    seen.push({ n, lat: v.lat, lng: v.lng });
    out.push({ n, k: kind, r: region, lat: +v.lat.toFixed(5), lng: +v.lng.toFixed(5), h: v.holes ? +v.holes : 0, c: clean(v.city) });
  };

  // 필드: golf_course 중 연습장/파3 아닌 것
  for (const e of fieldEls) {
    const v = el2v(e);
    const n = clean(v.name);
    if (/연습장|레인지|스크린|골프존|프렌즈/.test(n)) continue;
    push(e, "f");
  }
  // 스크린
  for (const e of screenEls) {
    const v = el2v(e);
    const n = clean(v.name);
    if (/연습장|레인지/.test(n)) continue;
    push(e, "s");
  }
  // 연습장
  for (const e of rangeEls) push(e, "r");

  const stat = k => out.filter(v => v.k === k).length;
  console.log(`FIELD ${stat("f")} | SCREEN ${stat("s")} | RANGE ${stat("r")} | total ${out.length}`);
  const byRegion = {};
  out.forEach(v => { byRegion[v.r] = (byRegion[v.r] || 0) + 1; });
  console.log("by region:", JSON.stringify(byRegion));

  const js = `/* 자동 생성: make_venues.mjs — OSM 전국 골프장/스크린/연습장 디렉토리 (실명·실좌표) */
const DIR_VENUES = ${JSON.stringify(out)};
`;
  fs.writeFileSync(new URL("./venues.js", import.meta.url), js);
  console.log("venues.js written:", js.length, "bytes");
  console.log("sample:", JSON.stringify(out.slice(0, 5)));
})();
