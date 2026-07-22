// 라스트티 Worker 로직 검증 (KV 목킹) — node worker/test.mjs
import worker from "./worker.js";

// 인메모리 KV 목
function mockKV() {
  const m = new Map();
  return {
    get: async (k) => (m.has(k) ? m.get(k) : null),
    put: async (k, v) => void m.set(k, v),
    list: async ({ prefix }) => ({ keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })) }),
    _map: m,
  };
}
const env = { LT_KV: mockKV() };
const BASE = "https://lasttee-api.workers.dev/api/v1";
const call = (method, path, { token, body } = {}) => {
  const h = { "Content-Type": "application/json", Origin: "https://unitransferpro.github.io" };
  if (token) h.Authorization = "Bearer " + token;
  return worker.fetch(new Request(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined }), env);
};

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); pass++; console.log("  ✓", name); }
  catch (e) { fail++; console.log("  ✗", name, "→", e.message); }
}
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m || ""} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`); };
const ok = (c, m) => { if (!c) throw new Error(m || "assert failed"); };

console.log("라스트티 백엔드 검증\n");

// health (KV 없어도 200)
await t("health: KV 바인딩 리포트", async () => {
  const r = await worker.fetch(new Request(BASE + "/health"), { LT_KV: null });
  const j = await r.json();
  eq(r.status, 200, "status"); eq(j.kv, false, "kv flag");
});
await t("KV 미설정 시 API 503", async () => {
  const r = await worker.fetch(new Request(BASE + "/posts"), { LT_KV: null });
  eq(r.status, 503, "status");
});

// 회원가입 2명 (호스트 + 참여자)
let host, joiner, hostTok, joinTok, hostUid, joinUid;
await t("회원가입: 토큰+프로필 발급", async () => {
  let r = await call("POST", "/auth/signup", { body: { nick: "박호스트", verified: true, avg: 84 } });
  eq(r.status, 201, "status"); let j = await r.json();
  ok(j.token && j.user.uid, "token+uid"); eq(j.user.nick, "박호스트", "nick"); eq(j.user.greenScore, 5.0, "green");
  hostTok = j.token; hostUid = j.user.uid;
  r = await call("POST", "/auth/signup", { body: { nick: "김참여", avg: 92 } });
  j = await r.json(); joinTok = j.token; joinUid = j.user.uid;
});
await t("회원가입: 닉네임 없으면 400", async () => {
  const r = await call("POST", "/auth/signup", { body: {} });
  eq(r.status, 400, "status");
});
await t("me: 토큰 없으면 401", async () => { eq((await call("GET", "/me")).status, 401, "status"); });
await t("me: 토큰으로 프로필 조회", async () => {
  const j = await (await call("GET", "/me", { token: hostTok })).json();
  eq(j.user.nick, "박호스트", "nick");
});
await t("me: 프로필 수정 반영", async () => {
  const j = await (await call("PUT", "/me", { token: hostTok, body: { avg: 80, region: "영남" } })).json();
  eq(j.user.avg, 80, "avg"); eq(j.user.region, "영남", "region");
});

// 승인제 모집 생성 → 신청 → 승인 흐름
let apprId;
await t("모집 생성(승인제)", async () => {
  const j = await (await call("POST", "/posts", { token: hostTok, body: { courseId: "sky72", instant: false, price: 155000, normal: 299000, region: "수도권", memo: "테스트" } })).json();
  ok(j.post.id, "id"); eq(j.post.status, "open", "status"); apprId = j.post.id;
});
await t("모집 목록: 열린 것 노출 + 호스트 프로필 임베드", async () => {
  const j = await (await call("GET", "/posts")).json();
  eq(j.posts.length, 1, "count"); eq(j.posts[0].host.nick, "박호스트", "host embed");
});
await t("참여 신청 → pending + 호스트 알림", async () => {
  const j = await (await call("POST", "/posts/" + apprId + "/join", { token: joinTok })).json();
  eq(j.status, "pending", "status");
  const n = await (await call("GET", "/notifs", { token: hostTok })).json();
  eq(n.notifs[0].title, "새 참여 신청", "host notif");
});
await t("호스트 아닌 사람이 승인 시도 → 403", async () => {
  eq((await call("POST", "/posts/" + apprId + "/approve", { token: joinTok, body: { uid: joinUid, ok: true } })).status, 403, "status");
});
await t("호스트 승인 → 멤버 편입 + 신청자 알림", async () => {
  const j = await (await call("POST", "/posts/" + apprId + "/approve", { token: hostTok, body: { uid: joinUid, ok: true } })).json();
  ok(j.post.joiners.includes(joinUid), "joiner added");
  const n = await (await call("GET", "/notifs", { token: joinTok })).json();
  eq(n.notifs[0].title, "참여가 확정됐어요", "joiner notif");
});

// 즉시확정 모집 흐름
let instId;
await t("모집 생성(즉시확정) → 참여 즉시 confirmed", async () => {
  let j = await (await call("POST", "/posts", { token: hostTok, body: { courseId: "lakeside", instant: true, price: 99000, normal: 189000, region: "수도권" } })).json();
  instId = j.post.id;
  j = await (await call("POST", "/posts/" + instId + "/join", { token: joinTok })).json();
  eq(j.status, "confirmed", "status"); ok(j.post.joiners.includes(joinUid), "joined");
});
await t("호스트는 자기 모집에 참여 불가 400", async () => {
  eq((await call("POST", "/posts/" + instId + "/join", { token: hostTok })).status, 400, "status");
});
await t("참여 취소 → 멤버에서 제거", async () => {
  const j = await (await call("POST", "/posts/" + instId + "/cancel", { token: joinTok })).json();
  ok(!j.post.joiners.includes(joinUid), "removed");
});
await t("모집 마감 → 목록에서 사라짐", async () => {
  await call("POST", "/posts/" + apprId + "/close", { token: hostTok });
  await call("POST", "/posts/" + instId + "/close", { token: hostTok });
  const j = await (await call("GET", "/posts")).json();
  eq(j.posts.length, 0, "no open posts");
});
await t("알림 읽음 처리", async () => {
  await call("POST", "/notifs/read", { token: hostTok });
  const n = await (await call("GET", "/notifs", { token: hostTok })).json();
  ok(n.notifs.every((x) => x.read), "all read");
});
await t("없는 모집 상세 404", async () => { eq((await call("GET", "/posts/nope")).status, 404, "status"); });

console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
process.exit(fail ? 1 : 0);
