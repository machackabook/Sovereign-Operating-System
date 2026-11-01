/**
 * Hamiltonian Parsing Cube — S.O.S. browser visualization adapter
 * Status: proposal module; browser-only, opt-in, non-authoritative.
 * Copyright notice/ownership should be validated by project counsel.
 */
export class HamiltonianOverlayEngine {
  constructor({ root = document.body, idleMs = 100_000, reducedMotion,
    onAlert = null, speech = false } = {}) {
    if (!root || !root.appendChild) throw new TypeError("root must be a DOM container");
    this.root = root;
    this.idleMs = Math.max(10_000, Number(idleMs) || 100_000);
    this.onAlert = typeof onAlert === "function" ? onAlert : null;
    this.speechEnabled = Boolean(speech); // off unless user opts in
    this.reducedMotion = reducedMotion ?? matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.lastActivity = performance.now();
    this.alerted = false;
    this.running = false;
    this.raf = 0;
    this.listeners = [];
    this.vertices = this.makeVertices();
    this.mount();
  }

  makeVertices() {
    const out = [];
    for (const x of [-1, 1]) for (const y of [-1, 1])
      for (const z of [-1, 1]) for (const w of [-1, 1]) out.push({ x, y, z, w });
    return out;
  }

  mount() {
    this.host = document.createElement("section");
    this.host.id = "sos-hamiltonian-overlay";
    this.host.hidden = true;
    Object.assign(this.host.style, {
      position: "fixed", inset: "0", zIndex: "2147483000",
      background: "rgba(4,8,14,.94)", color: "#b6ffda",
      font: "14px ui-monospace,monospace", display: "grid",
      placeItems: "center", overflow: "hidden"
    });
    this.host.setAttribute("aria-label", "S.O.S. visual notification layer");
    this.canvas = document.createElement("canvas");
    this.canvas.setAttribute("aria-hidden", "true");
    this.canvas.style.cssText = "width:100%;height:100%;position:absolute;inset:0";
    this.ctx = this.canvas.getContext("2d", { alpha: true });
    this.status = document.createElement("p");
    this.status.textContent = "S.O.S. notification. Visual overlay; underlying system remains unlocked.";
    Object.assign(this.status.style, { zIndex: "1", padding: "1rem", maxWidth: "42rem", textAlign: "center" });
    this.dismiss = document.createElement("button");
    this.dismiss.type = "button";
    this.dismiss.textContent = "Dismiss notification";
    this.dismiss.style.zIndex = "2";
    this.dismiss.addEventListener("click", () => this.dismissAlert());
    this.host.append(this.canvas, this.status, this.dismiss);
    this.root.appendChild(this.host);
    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener("resize", this.onResize);
    this.listeners.push(() => window.removeEventListener("resize", this.onResize));
    this.activityHandler = () => { this.lastActivity = performance.now(); };
    for (const type of ["pointerdown", "keydown", "touchstart"]) {
      window.addEventListener(type, this.activityHandler, { passive: true });
      this.listeners.push(() => window.removeEventListener(type, this.activityHandler));
    }
    this.motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
    this.motionHandler = e => { this.reducedMotion = e.matches; };
    this.motionQuery.addEventListener?.("change", this.motionHandler);
    this.listeners.push(() => this.motionQuery.removeEventListener?.("change", this.motionHandler));
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(innerWidth * dpr));
    this.canvas.height = Math.max(1, Math.round(innerHeight * dpr));
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  project4D(v, angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    const z = v.z * c - v.w * s;
    const w = v.z * s + v.w * c;
    const denom = 3.2 - w;
    const k = 1 / Math.max(0.25, denom);
    return { x: innerWidth / 2 + v.x * k * Math.min(innerWidth, innerHeight) * .25,
      y: innerHeight / 2 + v.y * k * Math.min(innerWidth, innerHeight) * .25, z };
  }

  draw(now = performance.now()) {
    if (!this.ctx || this.host.hidden) return;
    const w = innerWidth, h = innerHeight;
    this.ctx.clearRect(0, 0, w, h);
    const theta = this.reducedMotion ? 0 : now * .00025;
    const pts = this.vertices.map(v => this.project4D(v, theta));
    const edges = [];
    for (let i = 0; i < this.vertices.length; i++)
      for (let j = i + 1; j < this.vertices.length; j++) {
        const a = this.vertices[i], b = this.vertices[j];
        const diff = ["x", "y", "z", "w"].filter(k => a[k] !== b[k]).length;
        if (diff === 1) edges.push([pts[i], pts[j]]);
      }
    this.ctx.strokeStyle = "rgba(69,243,255,.42)";
    this.ctx.lineWidth = 1;
    for (const [a,b] of edges) {
      this.ctx.beginPath(); this.ctx.moveTo(a.x,a.y); this.ctx.lineTo(b.x,b.y); this.ctx.stroke();
    }
    pts.forEach((p,i) => {
      this.ctx.fillStyle = i % 2 ? "#45f3ff" : "#00ff75";
      this.ctx.beginPath(); this.ctx.arc(p.x,p.y,3.2,0,Math.PI*2); this.ctx.fill();
    });
    // Abstract particle-face mask: a schematic grid motif, not identity recognition.
    const cx=w/2, cy=h/2, r=Math.min(w,h)*.17;
    this.ctx.fillStyle="rgba(182,255,218,.7)";
    const mask=[[-.36,-.12],[-.22,-.2],[.22,-.2],[.36,-.12],[-.27,.02],[.27,.02],[-.15,.22],[0,.28],[.15,.22]];
    mask.forEach(([x,y],i)=>{this.ctx.beginPath();this.ctx.arc(cx+x*r,cy+y*r, i<4?3:2.5,0,Math.PI*2);this.ctx.fill();});
    if (!this.reducedMotion) this.raf = requestAnimationFrame(t => this.draw(t));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.tick();
  }
  tick() {
    if (!this.running) return;
    if (!this.alerted && performance.now()-this.lastActivity >= this.idleMs) {
      this.alerted = true;
      this.showAlert("S.O.S. attention notice. Select dismiss to close this visual notification.");
    }
    if (this.alerted) {
      this.host.hidden = false;
      this.draw();
    }
    this.timer = setTimeout(() => this.tick(), 250);
  }
  showAlert(message) {
    this.status.textContent = message;
    this.host.hidden = false;
    this.draw();
    this.onAlert?.({ type:"idle-alert", message, time:new Date().toISOString() });
    if (this.speechEnabled && "speechSynthesis" in window) {
      // User opt-in only; respect platform accessibility and do not seize screen-reader control.
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(message));
    }
  }
  setSpeechEnabled(enabled) { this.speechEnabled = Boolean(enabled); }
  announce(message) {
    this.status.textContent = String(message).slice(0, 1000);
    // Assistive technology may announce this ordinary DOM update.
    this.status.setAttribute("role", "status");
    this.status.setAttribute("aria-live", "polite");
  }
  dismissAlert() {
    this.alerted = false;
    this.lastActivity = performance.now();
    this.host.hidden = true;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }
  destroy() {
    this.running = false;
    clearTimeout(this.timer);
    cancelAnimationFrame(this.raf);
    this.listeners.splice(0).forEach(fn => fn());
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    this.host?.remove();
  }
}

/** Browser Web Crypto digest for canonical UTF-8 payload text.
 * Digest integrity only: it does not authenticate author, clock, sensor or result.
 */
export async function sha256Hex(canonicalText) {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto unavailable; use a secure context.");
  const bytes = new TextEncoder().encode(canonicalText);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,"0")).join("");
}
