/* ══════════════════ 라스트티 백엔드 (Cloudflare Worker + KV) ══════════════════
 * API 전용. 정적 앱(GitHub Pages)이 cross-origin으로 호출한다.
 * KV(LT_KV)가 없으면 모든 /api/*는 503을 돌려주고, 프론트는 데모 모드로 폴백한다.
 *
 * KV 스키마
 *   token:{token}   → uid
 *   user:{uid}      → 프로필 JSON
 *   post:{id}       → 모집 JSON (joiners[], requests[], status)
 *   notif:{uid}     → 알림 배열(JSON, 최대 50)
 * ============================================================================ */

const OK = 200, CREATED = 201, BAD = 400, UNAUTH = 401, FORBID = 403, NOPE = 404, GONE = 410, UNCONF = 503;

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status: status || OK,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors(origin) },
  });
}
const rid = (p) => p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const now = () => Date.now();

async function readUser(env, uid) { return uid ? JSON.parse((await env.LT_KV.get("user:" + uid)) || "null") : null; }
async function authUid(env, req) {
  const h = req.headers.get("Authorization") || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!t) return null;
  return await env.LT_KV.get("token:" + t);
}
async function pushNotif(env, uid, n) {
  const key = "notif:" + uid;
  const arr = JSON.parse((await env.LT_KV.get(key)) || "[]");
  arr.unshift({ id: rid("n_"), t: now(), read: false, ...n });
  await env.LT_KV.put(key, JSON.stringify(arr.slice(0, 50)));
}
// 공개 프로필(민감정보 제외)
function pubUser(u) {
  if (!u) return null;
  return { uid: u.uid, nick: u.nick, avatar: u.avatar, g: u.g, gender: u.gender, age: u.age, career: u.career, region: u.region, avg: u.avg, verified: !!u.verified, greenScore: u.greenScore ?? 5.0, rounds: u.rounds || 0 };
}
async function withJoiners(env, post) {
  const ids = [post.hostUid, ...(post.joiners || [])];
  const users = {};
  for (const id of ids) users[id] = pubUser(await readUser(env, id));
  return { ...post, members: ids.map((id) => users[id]).filter(Boolean), reqUsers: post.status === "open" ? await Promise.all((post.requests || []).map(async (r) => ({ ...r, user: pubUser(await readUser(env, r.uid)) }))) : [] };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin");
    const path = url.pathname.replace(/^\/api\/v1/, "");

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    if (!url.pathname.startsWith("/api/")) return json({ error: "라스트티 API" }, NOPE, origin);
    if (path === "/health" || path === "/health/") return json({ ok: true, kv: !!env.LT_KV, ver: "1.0" }, OK, origin);
    if (!env.LT_KV) return json({ error: "backend_not_configured", hint: "LT_KV 네임스페이스를 wrangler.toml에 바인딩하세요" }, UNCONF, origin);

    let body = {};
    if (req.method === "POST" || req.method === "PUT") { try { body = await req.json(); } catch (e) { body = {}; } }
    const seg = path.split("/").filter(Boolean); // ["posts","p_x","join"]

    try {
      // ── 회원가입: 프로필 생성 + 토큰 발급 ──
      if (path === "/auth/signup" && req.method === "POST") {
        const nick = (body.nick || "").trim();
        if (!nick) return json({ error: "nick_required" }, BAD, origin);
        const uid = rid("u_");
        const token = crypto.randomUUID();
        const u = { uid, nick, avatar: body.avatar ?? 2, g: body.g ?? 0, gender: body.gender || "남", age: body.age || "30대", career: body.career || "구력 3~7년", region: body.region || "수도권", avg: body.avg || 95, styles: body.styles || [], verified: !!body.verified, greenScore: 5.0, rounds: 0, createdAt: now() };
        await env.LT_KV.put("user:" + uid, JSON.stringify(u));
        await env.LT_KV.put("token:" + token, uid);
        return json({ token, user: pubUser(u) }, CREATED, origin);
      }

      // ── 내 프로필 ──
      if (path === "/me" && req.method === "GET") {
        const uid = await authUid(env, req); if (!uid) return json({ error: "unauth" }, UNAUTH, origin);
        return json({ user: pubUser(await readUser(env, uid)) }, OK, origin);
      }
      if (path === "/me" && req.method === "PUT") {
        const uid = await authUid(env, req); if (!uid) return json({ error: "unauth" }, UNAUTH, origin);
        const u = await readUser(env, uid); if (!u) return json({ error: "gone" }, GONE, origin);
        const F = ["nick", "avatar", "g", "gender", "age", "career", "region", "avg", "styles", "verified"];
        for (const k of F) if (k in body) u[k] = body[k];
        await env.LT_KV.put("user:" + uid, JSON.stringify(u));
        return json({ user: pubUser(u) }, OK, origin);
      }

      // ── 모집 목록 (열린 것만) ──
      if (path === "/posts" && req.method === "GET") {
        const list = await env.LT_KV.list({ prefix: "post:" });
        const out = [];
        for (const k of list.keys) {
          const p = JSON.parse((await env.LT_KV.get(k.name)) || "null");
          if (!p || p.status !== "open") continue;
          if (url.searchParams.get("region") && p.region !== url.searchParams.get("region")) continue;
          if (url.searchParams.get("kind") && p.kind !== url.searchParams.get("kind")) continue;
          out.push({ ...p, host: pubUser(await readUser(env, p.hostUid)) });
        }
        out.sort((a, b) => (a.teeAt || 0) - (b.teeAt || 0));
        return json({ posts: out }, OK, origin);
      }

      // ── 모집 생성 ──
      if (path === "/posts" && req.method === "POST") {
        const uid = await authUid(env, req); if (!uid) return json({ error: "unauth" }, UNAUTH, origin);
        const id = rid("p_");
        const p = {
          id, hostUid: uid, courseId: body.courseId || "", kind: body.kind || "field",
          teeAt: body.teeAt || now() + 864e5, holes: body.holes || 18, hours: body.hours || null,
          total: body.total || 4, joiners: [], normal: +body.normal || 0, price: +body.price || 0,
          reason: body.reason || "일행 취소", instant: body.instant !== false, level: body.level || "누구나",
          tags: body.tags || [], genderPref: body.genderPref || "무관", memo: body.memo || "",
          region: body.region || "", pay: body.pay || "onsite", status: "open", requests: [], createdAt: now(),
        };
        await env.LT_KV.put("post:" + id, JSON.stringify(p));
        return json({ post: p }, CREATED, origin);
      }

      // ── 모집 상세 / 액션 ──
      if (seg[0] === "posts" && seg[1]) {
        const pid = seg[1], action = seg[2];
        const p = JSON.parse((await env.LT_KV.get("post:" + pid)) || "null");
        if (!p) return json({ error: "not_found" }, NOPE, origin);

        if (!action && req.method === "GET") return json({ post: await withJoiners(env, p) }, OK, origin);

        const uid = await authUid(env, req); if (!uid) return json({ error: "unauth" }, UNAUTH, origin);
        const left = p.total - 1 - (p.joiners || []).length;

        if (action === "join" && req.method === "POST") {
          if (uid === p.hostUid) return json({ error: "host_cannot_join" }, BAD, origin);
          if (p.status !== "open") return json({ error: "closed" }, GONE, origin);
          if ((p.joiners || []).includes(uid)) return json({ error: "already_joined" }, BAD, origin);
          if (left <= 0) return json({ error: "full" }, GONE, origin);
          const joiner = await readUser(env, uid);
          if (p.instant) {
            p.joiners.push(uid);
            await env.LT_KV.put("post:" + pid, JSON.stringify(p));
            await pushNotif(env, p.hostUid, { icon: "ph-user-plus", title: "새 참여 확정", body: `${joiner.nick}님이 바로 참여했어요.`, route: "#/post/" + pid });
            return json({ status: "confirmed", post: await withJoiners(env, p) }, OK, origin);
          }
          if ((p.requests || []).some((r) => r.uid === uid)) return json({ error: "already_requested" }, BAD, origin);
          p.requests.push({ uid, t: now(), status: "pending" });
          await env.LT_KV.put("post:" + pid, JSON.stringify(p));
          await pushNotif(env, p.hostUid, { icon: "ph-hand-waving", title: "새 참여 신청", body: `${joiner.nick}님이 참여를 신청했어요. 확인 후 승인해주세요.`, route: "#/post/" + pid });
          return json({ status: "pending", post: await withJoiners(env, p) }, OK, origin);
        }

        if (action === "approve" && req.method === "POST") {
          if (uid !== p.hostUid) return json({ error: "not_host" }, FORBID, origin);
          const r = (p.requests || []).find((x) => x.uid === body.uid && x.status === "pending");
          if (!r) return json({ error: "no_request" }, NOPE, origin);
          r.status = body.ok ? "approved" : "rejected";
          if (body.ok) {
            p.joiners.push(body.uid);
            await pushNotif(env, body.uid, { icon: "ph-check-circle", title: "참여가 확정됐어요", body: "호스트가 승인했어요. 라운드에서 만나요!", route: "#/post/" + pid });
          } else {
            await pushNotif(env, body.uid, { icon: "ph-x-circle", title: "참여 신청 결과", body: "이번 모집은 아쉽게 마감됐어요.", route: "#/home" });
          }
          await env.LT_KV.put("post:" + pid, JSON.stringify(p));
          return json({ post: await withJoiners(env, p) }, OK, origin);
        }

        if (action === "cancel" && req.method === "POST") {
          p.joiners = (p.joiners || []).filter((x) => x !== uid);
          await env.LT_KV.put("post:" + pid, JSON.stringify(p));
          return json({ post: await withJoiners(env, p) }, OK, origin);
        }

        if (action === "close" && req.method === "POST") {
          if (uid !== p.hostUid) return json({ error: "not_host" }, FORBID, origin);
          p.status = "closed";
          await env.LT_KV.put("post:" + pid, JSON.stringify(p));
          return json({ ok: true }, OK, origin);
        }
      }

      // ── 알림 ──
      if (path === "/notifs" && req.method === "GET") {
        const uid = await authUid(env, req); if (!uid) return json({ error: "unauth" }, UNAUTH, origin);
        return json({ notifs: JSON.parse((await env.LT_KV.get("notif:" + uid)) || "[]") }, OK, origin);
      }
      if (path === "/notifs/read" && req.method === "POST") {
        const uid = await authUid(env, req); if (!uid) return json({ error: "unauth" }, UNAUTH, origin);
        const arr = JSON.parse((await env.LT_KV.get("notif:" + uid)) || "[]").map((n) => ({ ...n, read: true }));
        await env.LT_KV.put("notif:" + uid, JSON.stringify(arr));
        return json({ ok: true }, OK, origin);
      }

      return json({ error: "route_not_found", path }, NOPE, origin);
    } catch (e) {
      return json({ error: "server_error", message: String(e && e.message || e) }, 500, origin);
    }
  },
};
