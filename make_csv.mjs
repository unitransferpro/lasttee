// 한국 골프장 리스트.csv → venues.js 병합 (매칭 보강 + 신규 지오코딩)
import fs from "fs";

const CSV = "/Users/jaysonk0312/Downloads/한국 골프장 리스트.csv";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => (s || "").replace(/\s+/g, "").replace(/컨트리클럽|칸트리클럽/g, "CC").replace(/골프클럽|골프장|골프리조트|골프앤리조트/g, "GC").replace(/\(.*?\)/g, "").replace(/주식회사|㈜/g, "").toLowerCase();
const REGION = { "서울": "수도권", "인천": "수도권", "경기": "수도권", "강원": "강원", "충북": "충청", "충남": "충청", "대전": "충청", "세종": "충청", "전북": "호남", "전남": "호남", "광주": "호남", "경북": "영남", "경남": "영남", "대구": "영남", "부산": "영남", "울산": "영남", "제주": "제주" };

// 1) CSV 파싱
const raw = fs.readFileSync(CSV, "utf8").replace(/^﻿/, "");
const lines = raw.split(/\r?\n/).filter(l => l.trim());
const rows = [];
for (const line of lines.slice(1)) {
  const p = line.split(",");
  if (p.length < 7) continue;
  const region = p[0].trim();
  const name = p[1].trim();
  const type = p[p.length - 1].trim();
  const holes = parseInt(p[p.length - 2]) || 0;
  const addr = p.slice(3, p.length - 3).join(",").trim();
  if (!name || !REGION[region]) continue;
  rows.push({ region, r: REGION[region], name, addr, holes, type });
}
console.log("CSV rows:", rows.length);

// 2) 기존 디렉토리 + 큐레이션 로드
const venuesSrc = fs.readFileSync("./venues.js", "utf8");
const DIR = JSON.parse(venuesSrc.match(/const DIR_VENUES = (\[.*\]);/s)[1]);
const dataSrc = fs.readFileSync("./data.js", "utf8");
const curatedNames = [...dataSrc.matchAll(/name: "([^"]+)"/g)].map(m => norm(m[1])).filter(n => n.length >= 3);

// 3) 매칭: CSV → 디렉토리 보강 / 큐레이션 중복 스킵 / 신규 수집
let enriched = 0, curSkip = 0;
const newRows = [];
for (const row of rows) {
  const nr = norm(row.name);
  if (curatedNames.some(cn => cn === nr || (nr.length >= 4 && (cn.includes(nr) || nr.includes(cn))))) { curSkip++; continue; }
  const hit = DIR.find(v => v.k === "f" && v.r === row.r && (() => { const nv = norm(v.n); return nv === nr || (nr.length >= 4 && (nv.includes(nr) || nr.includes(nv))); })());
  if (hit) {
    hit.h = row.holes || hit.h;
    hit.t = row.type;
    hit.a = row.addr;
    enriched++;
  } else {
    newRows.push(row);
  }
}
console.log(`enriched ${enriched} | curated-skip ${curSkip} | NEW ${newRows.length}`);

// 4) 신규 지오코딩 (도로명 주소 → 실패 시 읍면동)
async function geocode(q) {
  try {
    const u = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=kr&q=${encodeURIComponent(q)}`;
    const res = await fetch(u, { headers: { "User-Agent": "lasttee-build/1.0 (minjoon@logify.co.kr)" } });
    if (!res.ok) return null;
    const js = await res.json();
    return js[0] ? { lat: +(+js[0].lat).toFixed(5), lng: +(+js[0].lon).toFixed(5) } : null;
  } catch (e) { return null; }
}
let g1 = 0, g2 = 0, g0 = 0;
const added = [];
for (const row of newRows) {
  let hit = await geocode(row.addr);
  let x = 0;
  await sleep(1050);
  if (!hit) {
    // 이름으로 시도
    hit = await geocode(row.name);
    await sleep(1050);
  }
  if (!hit) {
    const coarse = row.addr.split(" ").slice(0, 2).join(" ");
    hit = await geocode(`${row.region} ${coarse}`);
    x = 1;
    await sleep(1050);
  }
  if (hit) { x === 0 ? g1++ : g2++; } else { g0++; }
  added.push({
    n: row.name, k: "f", r: row.r,
    lat: hit ? hit.lat : 0, lng: hit ? hit.lng : 0,
    h: row.holes, c: row.addr.split(" ")[0] || "", t: row.type, a: row.addr, ...(x ? { x: 1 } : {}),
  });
  if ((g1 + g2 + g0) % 25 === 0) console.log(`  geocoded ${g1 + g2 + g0}/${newRows.length} (정밀 ${g1} 근사 ${g2} 실패 ${g0})`);
}
console.log(`geocode done: 정밀 ${g1} | 근사 ${g2} | 좌표없음 ${g0}`);

// 5) 신규 중 서로/기존과 좌표 중복 제거 후 병합
const km = (a, b) => Math.hypot((a.lat - b.lat) * 111, (a.lng - b.lng) * 88);
const merged = [...DIR];
let dup = 0;
for (const v of added) {
  if (v.lat && merged.some(m => m.k === "f" && m.lat && km(m, v) < 1.2 && norm(m.n) === norm(v.n))) { dup++; continue; }
  merged.push(v);
}
console.log(`merged: ${DIR.length} + ${added.length - dup} (dup ${dup}) = ${merged.length}`);
const stat = k => merged.filter(v => v.k === k).length;
console.log(`FIELD ${stat("f")} | SCREEN ${stat("s")}`);

fs.writeFileSync("./venues.js", `/* 자동 생성: make_venues.mjs + make_csv.mjs — 전국 골프장/스크린 디렉토리 (실명·실좌표·공시 리스트) */\nconst DIR_VENUES = ${JSON.stringify(merged)};\n`);
console.log("venues.js written:", fs.statSync("./venues.js").size, "bytes");
