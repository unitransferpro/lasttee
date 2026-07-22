/* ══════════ 라스트티 백엔드 클라이언트 ══════════
 * LT_API가 설정돼 있고 /health가 살아있으면 실백엔드(Cloudflare Worker) 사용,
 * 아니면 이 파일은 아무 것도 하지 않고 앱은 기존 localStorage 데모 모드로 동작한다.
 *
 * 백엔드 배포 후 활성화: 아래 LT_API를 워커 주소로 바꾸면 끝.
 *   window.LT_API = "https://lasttee-api.<서브도메인>.workers.dev/api/v1";
 */
window.LT_API = window.LT_API || ""; // 배포 후 워커 주소 입력 (비우면 데모 모드)

const LT = {
  base: window.LT_API,
  online: false,
  token: null,
  async init() {
    if (!this.base) return false;
    this.token = localStorage.getItem("lt_token");
    try {
      const r = await fetch(this.base + "/health", { cache: "no-store" });
      const j = await r.json();
      this.online = !!(j && j.ok && j.kv);
    } catch (e) { this.online = false; }
    return this.online;
  },
  headers() {
    const h = { "Content-Type": "application/json" };
    if (this.token) h.Authorization = "Bearer " + this.token;
    return h;
  },
  async req(method, path, body) {
    const r = await fetch(this.base + path, { method, headers: this.headers(), body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401) { this.token = null; localStorage.removeItem("lt_token"); }
    let j = null; try { j = await r.json(); } catch (e) {}
    if (!r.ok) throw Object.assign(new Error((j && j.error) || ("HTTP " + r.status)), { status: r.status, data: j });
    return j;
  },
  // 인증
  async signup(profile) {
    const j = await this.req("POST", "/auth/signup", profile);
    this.token = j.token; localStorage.setItem("lt_token", j.token);
    return j.user;
  },
  me() { return this.req("GET", "/me"); },
  updateMe(patch) { return this.req("PUT", "/me", patch); },
  // 모집
  posts(q = "") { return this.req("GET", "/posts" + (q ? "?" + q : "")); },
  post(id) { return this.req("GET", "/posts/" + id); },
  createPost(p) { return this.req("POST", "/posts", p); },
  join(id, pay) { return this.req("POST", "/posts/" + id + "/join", { pay }); },
  approve(id, uid, ok) { return this.req("POST", "/posts/" + id + "/approve", { uid, ok }); },
  cancel(id) { return this.req("POST", "/posts/" + id + "/cancel"); },
  close(id) { return this.req("POST", "/posts/" + id + "/close"); },
  // 알림
  notifs() { return this.req("GET", "/notifs"); },
  readNotifs() { return this.req("POST", "/notifs/read"); },
};
window.LT = LT;
