// 웹 자산을 www/ 로 복사 → Capacitor webDir (GitHub Pages는 루트 그대로 유지)
// node scripts/build-www.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const www = path.join(root, "www");

const FILES = [
  "index.html", "styles.css", "app.js", "data.js", "geo.js", "venues.js",
  "api.js", "sw.js", "manifest.webmanifest",
];
const DIRS = ["icons"];

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });

let copied = 0;
for (const f of FILES) {
  const src = path.join(root, f);
  if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(www, f)); copied++; }
  else console.warn("  누락:", f);
}
for (const d of DIRS) {
  const src = path.join(root, d);
  if (fs.existsSync(src)) { fs.cpSync(src, path.join(www, d), { recursive: true }); copied++; }
}
console.log(`www/ 생성 완료 — ${copied}개 항목 복사`);
