// 추가 실측 수집: 골프연습장(driving range) + 스크린 브랜드 확장 → venues.js 병합
import fs from "fs";

const EPS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => (s || "").replace(/\s+/g, "").replace(/컨트리클럽/g, "CC").replace(/골프클럽|골프장/g, "GC").toLowerCase();
const km = (a, b) => Math.hypot((a.lat - b.lat) * 111, (a.lng - b.lng) * 88);

async function overpass(q, label) {
  for (const ep of EPS) {
    try {
      console.log(`[${label}] ${ep.split("/")[2]}`);
      const res = await fetch(ep, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "lasttee-build/1.0" } });
      if (!res.ok) { console.log(`  http ${res.status}`); await sleep(4000); continue; }
      const js = await res.json();
      console.log(`  → ${(js.elements || []).length}`);
      return js.elements || [];
    } catch (e) { console.log(`  err ${String(e.message).slice(0, 50)}`); await sleep(4000); }
  }
  return [];
}

(async () => {
  // 1) 연습장 (driving range 태그 + 이름)
  const qR1 = `[out:json][timeout:100];area["ISO3166-1"="KR"][admin_level=2]->.kr;(nwr["golf"="driving_range"](area.kr);nwr["leisure"="driving_range"](area.kr););out center tags;`;
  const r1 = await overpass(qR1, "range-tag");
  await sleep(5000);
  const qR2 = `[out:json][timeout:100];area["ISO3166-1"="KR"][admin_level=2]->.kr;nwr["name"~"골프연습장|골프 연습장|드라이빙레인지|드라이빙 레인지"](area.kr);out center tags;`;
  const r2 = await overpass(qR2, "range-name");
  await sleep(5000);
  // 2) 스크린 브랜드 확장
  const qS = `[out:json][timeout:100];area["ISO3166-1"="KR"][admin_level=2]->.kr;nwr["name"~"레드골프|지스윙|GDR|카카오 ?VX|시티존|퍼블릭스크린"](area.kr);out center tags;`;
  const s1 = await overpass(qS, "screen-extra");

  // 3) 도 경계 → 지역 분류
  const gj = await (await fetch("https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json/skorea_provinces_geo_simple.json")).json();
  const provs = gj.features.map(f => ({ name: f.properties.name || "", polys: (f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates]).map(p => p[0]) }));
  const inRing = (lng, lat, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c; } return c; };
  const REGION = { "서울특별시": "수도권", "인천광역시": "수도권", "경기도": "수도권", "강원도": "강원", "강원특별자치도": "강원", "충청북도": "충청", "충청남도": "충청", "대전광역시": "충청", "세종특별자치시": "충청", "전라북도": "호남", "전북특별자치도": "호남", "전라남도": "호남", "광주광역시": "호남", "경상북도": "영남", "경상남도": "영남", "대구광역시": "영남", "부산광역시": "영남", "울산광역시": "영남", "제주특별자치도": "제주" };
  const regionOf = (lat, lng) => { for (const p of provs) for (const ring of p.polys) if (inRing(lng, lat, ring)) return REGION[p.name] || ""; let best = "", bd = 1e9; for (const p of provs) for (const ring of p.polys) for (const pt of ring) { const d = (pt[0] - lng) ** 2 + (pt[1] - lat) ** 2; if (d < bd) { bd = d; best = p.name; } } return REGION[best] || ""; };

  // 4) 기존 로드 + 병합
  const src = fs.readFileSync("./venues.js", "utf8");
  const DIR = JSON.parse(src.match(/const DIR_VENUES = (\[.*\]);/s)[1]);
  const dataSrc = fs.readFileSync("./data.js", "utf8");
  const curCoords = [...dataSrc.matchAll(/lat: ([\d.]+), lng: ([\d.]+)/g)].map(m => ({ lat: +m[1], lng: +m[2] }));

  let addR = 0, addS = 0, skip = 0;
  const pushAll = (els, kindDefault) => {
    for (const e of els) {
      const name = (e.tags && (e.tags["name:ko"] || e.tags.name)) || "";
      const lat = e.center ? e.center.lat : e.lat, lng = e.center ? e.center.lon : e.lon;
      if (!name || !lat) continue;
      const n = name.replace(/\s+/g, " ").trim();
      if (n.length < 2 || n.length > 30) continue;
      if (/골프텔|샵|매장|백화점|의류|중고|스토어/.test(n)) continue;
      let k = kindDefault;
      if (/연습장|레인지|아카데미|GDR/i.test(n)) k = "r";
      else if (/스크린|골프존파크|프렌즈|레드골프|지스윙|시티존/.test(n)) k = "s";
      else if (kindDefault === "r") k = "r";
      const dup = DIR.some(v => km(v, { lat, lng }) < 0.3 && norm(v.n) === norm(n)) ||
        DIR.some(v => v.k === k && km(v, { lat, lng }) < 0.15) ||
        curCoords.some(c => km(c, { lat, lng }) < 0.15);
      if (dup) { skip++; continue; }
      const r = regionOf(lat, lng);
      if (!r) { skip++; continue; }
      DIR.push({ n, k, r, lat: +lat.toFixed(5), lng: +lng.toFixed(5), h: 0, c: "" });
      k === "r" ? addR++ : addS++;
    }
  };
  pushAll(r1, "r");
  pushAll(r2, "r");
  pushAll(s1, "s");
  console.log(`added ranges ${addR}, screens ${addS}, skipped ${skip}`);
  const stat = k => DIR.filter(v => v.k === k).length;
  console.log(`FIELD ${stat("f")} | SCREEN ${stat("s")} | RANGE ${stat("r")} | total ${DIR.length}`);

  fs.writeFileSync("./venues.js", `/* 자동 생성 — 전국 골프장/스크린/연습장 디렉토리 (OSM 실측 + 공시 리스트) */\nconst DIR_VENUES = ${JSON.stringify(DIR)};\n`);
  console.log("venues.js written");
})();
