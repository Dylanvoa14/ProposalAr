/* ============================================================
   LA MESA — motor de la experiencia (v2)
   (No hace falta editar este archivo; los textos están en content.js)
   ============================================================ */
(() => {
  "use strict";

  /* ---------- Estado ---------- */
  const store = {
    get seen() { return JSON.parse(localStorage.getItem("lm_seen") || "[]"); },
    markSeen(n) {
      const s = new Set(this.seen); s.add(n);
      localStorage.setItem("lm_seen", JSON.stringify([...s]));
    },
    get dev() { return localStorage.getItem("lm_dev") === "1"; },
    set dev(v) { v ? localStorage.setItem("lm_dev", "1") : localStorage.removeItem("lm_dev"); },
  };

  /* ---------- Modo dev (?dev=CLAVE / ?dev=off) ---------- */
  const qs = new URLSearchParams(location.search);
  if (qs.get("dev") === CONFIG.devKey) store.dev = true;
  if (qs.get("dev") === "off") store.dev = false;
  if (store.dev) document.getElementById("devBadge").classList.remove("hidden");

  /* ---------- Hora confiable (anti cambio de reloj) ---------- */
  let serverOffset = 0;
  async function syncTime() {
    try {
      const r = await fetch(location.href.split("?")[0] + "?t=" + Date.now(), {
        method: "HEAD", cache: "no-store",
      });
      const d = r.headers.get("Date") || r.headers.get("date");
      if (d) {
        const server = new Date(d).getTime();
        if (!isNaN(server)) serverOffset = server - Date.now();
      }
    } catch (e) { /* sin red o file:// → hora local */ }
  }
  const now = () => Date.now() + serverOffset;
  const isUnlocked = (ep) => store.dev || now() >= new Date(ep.unlockISO).getTime();

  /* ---------- Utilidades ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const vibrate = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

  function quoteHTML(ep) {
    const q = esc(ep.quote);
    const w = ep.hiddenWord;
    if (w === ",") {
      const i = q.indexOf(",");
      if (i < 0) return q;
      return q.slice(0, i) + '<span class="kw">,</span>' + q.slice(i + 1);
    }
    const re = new RegExp("\\b(" + w + ")\\b", "i");
    return q.replace(re, '<span class="kw">$1</span>');
  }

  function fmtCountdown(ms) {
    if (ms <= 0) return "00:00:00";
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return (d > 0 ? d + "d " : "") + h + ":" + m + ":" + ss;
  }

  /* ---------- Portada ---------- */
  const list = $("#episodeList");
  let countdownTimer = null;

  function renderHome() {
    list.innerHTML = "";
    clearInterval(countdownTimer);
    const seen = store.seen;
    let nextLocked = null;

    EPISODES.forEach((ep) => {
      const unlocked = isUnlocked(ep);
      if (!unlocked && !nextLocked) nextLocked = ep;
      const wasSeen = seen.includes(ep.num);

      const card = document.createElement(unlocked ? "button" : "div");
      card.className = "ep-card " + (unlocked ? "unlocked" : "locked") + (wasSeen ? " seen" : "");
      card.style.setProperty("--ep-accent", ep.accent);
      card.innerHTML = `
        <div class="ep-thumb"><span class="ep-num">${ep.num}</span></div>
        <div class="ep-info">
          <span class="ep-kicker">Episodio ${ep.num} · ${esc(ep.genre)}</span>
          <span class="ep-title">${unlocked ? esc(ep.title) : "· · ·"}</span>
          <span class="ep-syn">${esc(ep.synopsis)}</span>
          <span class="ep-state">
            <span class="dot"></span>
            <span class="st">${
              unlocked
                ? (wasSeen ? "visto · volver a ver" : "disponible · toca para ver")
                : esc(ep.lockedHint)
            }</span>
          </span>
        </div>`;
      if (unlocked) card.addEventListener("click", () => openEpisode(ep));
      list.appendChild(card);
    });

    if (nextLocked) {
      const stEl = list.children[nextLocked.num - 1].querySelector(".st");
      const tick = () => {
        const ms = new Date(nextLocked.unlockISO).getTime() - now();
        if (ms <= 0) { renderHome(); return; }
        stEl.innerHTML = `se estrena en <span class="countdown">${fmtCountdown(ms)}</span>`;
      };
      tick();
      countdownTimer = setInterval(tick, 1000);
    }

    const unlockedCount = EPISODES.filter(isUnlocked).length;
    $("#progressBadge").textContent =
      unlockedCount >= 7 ? "temporada completa" : `${unlockedCount}/7 estrenados`;

    renderShelf();
  }

  function renderShelf() {
    const seen = store.seen.filter((n) => n <= 6).sort((a, b) => a - b);
    const shelf = $("#shelf");
    if (!seen.length) { shelf.classList.add("hidden"); return; }
    shelf.classList.remove("hidden");
    $("#shelfCards").innerHTML = seen.map((n) => {
      const ep = EPISODES[n - 1];
      return `<div class="mini-card" style="--ep-accent:${ep.accent}">
        <span class="mc-ep">Episodio ${n}</span>“${esc(ep.quote)}”</div>`;
    }).join("");
  }

  /* ---------- Reproductor ---------- */
  const player = $("#player");
  const content = $("#playerContent");
  let cleanupFns = [];

  const RENDERERS = {
    pong: epPong, park: epPark, sitcom: epSitcom, hall: epHall,
    inventory: epInventory, jam: epJam, finale: epFinale,
  };

  function openEpisode(ep) {
    cleanupFns.forEach((f) => f()); cleanupFns = [];
    content.innerHTML = "";
    player.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    player.scrollTop = 0;
    RENDERERS[ep.type](ep);
  }
  function closePlayer() {
    cleanupFns.forEach((f) => f()); cleanupFns = [];
    player.classList.add("hidden");
    content.innerHTML = "";
    document.body.style.overflow = "";
    renderHome();
  }
  $("#closePlayer").addEventListener("click", closePlayer);

  function epHeader(ep) {
    return `<div class="ep-header fade-in">
      <span class="kicker">Episodio ${ep.num} · ${esc(ep.genre)}</span>
      <h2>${esc(ep.title)}</h2>
    </div>`;
  }

  function showQuoteCard(ep) {
    cleanupFns.forEach((f) => f()); cleanupFns = [];
    store.markSeen(ep.num);
    content.innerHTML = `
      <div class="quote-card-wrap">
        <div>
          <div class="quote-card" style="--ep-accent:${ep.accent}">
            <div class="qc-label">tarjeta del episodio</div>
            <div class="qc-text">“${quoteHTML(ep)}”</div>
            <div class="qc-ep">LA MESA · E${ep.num}</div>
          </div>
          <p class="teaser fade-in" style="animation-delay:.8s">
            <span class="t-label">en el próximo episodio</span>${esc(ep.teaser)}
          </p>
          <div style="text-align:center; margin-top:36px">
            <button class="btn ghost" id="backBtn">volver a la temporada</button>
          </div>
        </div>
      </div>`;
    $("#backBtn").addEventListener("click", closePlayer);
    player.scrollTop = 0;
  }

  /* ============================================================
     E1 · PILOTO — ping pong jugable
     Vista cenital: su paleta abajo (sigue el dedo), rival arriba.
     Cada devolución que logra revela un capítulo de la historia.
     ============================================================ */
  function epPong(ep) {
    content.innerHTML = `
      <div class="ep-screen">
        ${epHeader(ep)}
        <p class="hint" style="margin:0 0 14px">${esc(ep.intro)}</p>
        <div class="pong-wrap">
          <canvas class="pong-canvas" id="pongC"></canvas>
          <div class="pong-story" id="story">
            <div>
              <div class="ps-text">Desliza el dedo para mover tu paleta.\nDevuelve la pelota para avanzar la historia.</div>
              <div class="ps-tap">toca para empezar</div>
            </div>
          </div>
          <div class="pong-score">
            <span id="rallyLbl">capítulos: 0 / ${ep.vignettes.length}</span>
            <span>LA MESA · E1</span>
          </div>
        </div>
      </div>`;

    const canvas = $("#pongC"), story = $("#story");
    const W = 400, H = 560;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.aspectRatio = W + "/" + H;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const state = {
      running: false, chapter: 0,
      me: { x: W / 2, y: H - 46, w: 92, h: 12 },
      ai: { x: W / 2, y: 34, w: 92, h: 12 },
      ball: { x: W / 2, y: H / 2, r: 9, vx: 0, vy: 0 },
      trail: [], msg: "",
      raf: null, done: false,
    };

    function serve(toPlayer = true) {
      state.ball.x = W / 2;
      state.ball.y = H / 2;
      const speed = 4.1 + state.chapter * 0.5;
      const ang = (Math.random() * 0.8 - 0.4);
      state.ball.vx = Math.sin(ang) * speed;
      state.ball.vy = (toPlayer ? 1 : -1) * Math.cos(ang) * speed;
      state.trail = [];
    }

    function movePaddle(clientX) {
      const r = canvas.getBoundingClientRect();
      const x = ((clientX - r.left) / r.width) * W;
      state.me.x = Math.max(state.me.w / 2, Math.min(W - state.me.w / 2, x));
    }
    const onPtr = (e) => { movePaddle(e.touches ? e.touches[0].clientX : e.clientX); };
    canvas.addEventListener("pointermove", onPtr);
    canvas.addEventListener("pointerdown", onPtr);
    canvas.addEventListener("touchmove", onPtr, { passive: true });

    function pauseWithChapter() {
      state.running = false;
      const last = state.chapter >= ep.vignettes.length;
      story.innerHTML = last
        ? `<div><div class="ps-text">${esc("Fin del capítulo piloto.")}</div>
             <div class="ps-tap">toca para ver la tarjeta del episodio</div></div>`
        : `<div><div class="ps-text">${esc(ep.vignettes[state.chapter])}</div>
             <div class="ps-tap">toca para seguir jugando</div></div>`;
      story.classList.remove("hidden");
      const shown = last ? ep.vignettes.length : state.chapter + 1;
      $("#rallyLbl").textContent = `capítulos: ${shown} / ${ep.vignettes.length}`;
      story.onclick = () => {
        if (last) { showQuoteCard(ep); return; }
        state.chapter++;
        story.classList.add("hidden");
        serve(true);
        state.running = true;
      };
    }

    function step() {
      if (state.done) return;
      const b = state.ball, me = state.me, ai = state.ai;
      if (state.running) {
        b.x += b.vx; b.y += b.vy;
        state.trail.push({ x: b.x, y: b.y });
        if (state.trail.length > 12) state.trail.shift();

        // paredes
        if (b.x < b.r) { b.x = b.r; b.vx *= -1; }
        if (b.x > W - b.r) { b.x = W - b.r; b.vx *= -1; }

        // rival (siempre devuelve, con estilo)
        ai.x += (b.x - ai.x) * 0.12;
        if (b.vy < 0 && b.y - b.r < ai.y + ai.h && b.y > ai.y) {
          if (Math.abs(b.x - ai.x) < ai.w / 2 + b.r) {
            b.vy = Math.abs(b.vy);
            b.vx += (b.x - ai.x) * 0.04;
            vibrate(8);
          }
        }
        // su paleta
        if (b.vy > 0 && b.y + b.r > me.y && b.y < me.y + me.h + 14) {
          if (Math.abs(b.x - me.x) < me.w / 2 + b.r) {
            b.vy = -Math.abs(b.vy) * 1.03;
            b.vx += (b.x - me.x) * 0.05;
            vibrate(12);
            pauseWithChapter();
          }
        }
        // se le pasó: nueva pelota, sin castigo
        if (b.y > H + 30) { state.msg = "casi — va de nuevo"; serve(true); }
        if (b.y < -30) { serve(false); }
      }

      // ---- dibujo ----
      ctx.clearRect(0, 0, W, H);
      // mesa
      ctx.fillStyle = "#14352a";
      roundRect(ctx, 14, 14, W - 28, H - 28, 14); ctx.fill();
      ctx.strokeStyle = "#e8e6e133"; ctx.lineWidth = 2;
      roundRect(ctx, 14, 14, W - 28, H - 28, 14); ctx.stroke();
      // red
      ctx.setLineDash([7, 7]);
      ctx.strokeStyle = "#e8e6e155";
      ctx.beginPath(); ctx.moveTo(14, H / 2); ctx.lineTo(W - 14, H / 2); ctx.stroke();
      ctx.setLineDash([]);
      // línea central
      ctx.strokeStyle = "#e8e6e112";
      ctx.beginPath(); ctx.moveTo(W / 2, 14); ctx.lineTo(W / 2, H - 14); ctx.stroke();
      // estela
      state.trail.forEach((t, i) => {
        ctx.globalAlpha = (i / state.trail.length) * 0.35;
        ctx.fillStyle = "#ffe9c9";
        ctx.beginPath(); ctx.arc(t.x, t.y, 6, 0, 7); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // paletas
      ctx.fillStyle = "#c9563e";
      roundRect(ctx, ai.x - ai.w / 2, ai.y, ai.w, ai.h, 6); ctx.fill();
      ctx.fillStyle = "#7fb4c9";
      roundRect(ctx, me.x - me.w / 2, me.y, me.w, me.h, 6); ctx.fill();
      ctx.shadowColor = "#7fb4c9"; ctx.shadowBlur = 14;
      roundRect(ctx, me.x - me.w / 2, me.y, me.w, me.h, 6); ctx.fill();
      ctx.shadowBlur = 0;
      // pelota
      ctx.fillStyle = "#fff4dd";
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
      // mensaje
      if (state.msg && state.running) {
        ctx.fillStyle = "#e8e6e177"; ctx.font = "12px Inter, sans-serif"; ctx.textAlign = "center";
        ctx.fillText(state.msg, W / 2, H / 2 - 16);
      }

      state.raf = requestAnimationFrame(step);
    }
    function roundRect(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r); c.closePath();
    }

    // pantalla inicial: toca para empezar
    story.onclick = () => {
      story.classList.add("hidden");
      serve(true); state.running = true; state.msg = "";
    };

    state.raf = requestAnimationFrame(step);
    cleanupFns.push(() => { state.done = true; cancelAnimationFrame(state.raf); });
  }

  /* ============================================================
     E2 · EL EPISODIO TRANQUILO — parque nocturno con scroll
     ============================================================ */
  function epPark(ep) {
    content.innerHTML = `
      <div class="park">
        <div class="park-sky" id="sky"></div>
        <div class="park-moon" id="moon"></div>
        <div class="park-scroll">
          ${epHeader(ep)}
          <p class="hint" style="text-align:center">${esc(ep.hint)}</p>
          ${ep.fragments.map((f) => `<div class="park-frag">${esc(f)}</div>`).join("")}
          <div class="park-scene fade-in">
            <svg viewBox="0 0 320 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="La máquina del parque y dos heyfit">
              <!-- suelo -->
              <line x1="10" y1="132" x2="310" y2="132" stroke="#5c636c" stroke-width="2" stroke-linecap="round"/>
              <!-- máquina de piernas -->
              <line x1="80" y1="132" x2="80" y2="52" stroke="#9a8fd1" stroke-width="4" stroke-linecap="round"/>
              <line x1="80" y1="60" x2="130" y2="78" stroke="#9a8fd1" stroke-width="4" stroke-linecap="round"/>
              <rect x="122" y="72" width="26" height="9" rx="4" fill="#9a8fd1"/>
              <line x1="80" y1="90" x2="46" y2="112" stroke="#9a8fd1" stroke-width="4" stroke-linecap="round"/>
              <rect x="30" y="106" width="24" height="9" rx="4" fill="#9a8fd1"/>
              <circle cx="80" cy="52" r="5" fill="#9a8fd1"/>
              <!-- asiento doble -->
              <rect x="168" y="96" width="70" height="8" rx="4" fill="#7d739e"/>
              <line x1="176" y1="104" x2="176" y2="132" stroke="#7d739e" stroke-width="4" stroke-linecap="round"/>
              <line x1="230" y1="104" x2="230" y2="132" stroke="#7d739e" stroke-width="4" stroke-linecap="round"/>
              <!-- dos heyfit -->
              <rect x="256" y="96" width="13" height="34" rx="5" fill="none" stroke="#d8e37a" stroke-width="2.5"/>
              <rect x="259" y="88" width="7" height="9" rx="2.5" fill="none" stroke="#d8e37a" stroke-width="2.5"/>
              <rect x="280" y="96" width="13" height="34" rx="5" fill="none" stroke="#d8e37a" stroke-width="2.5"/>
              <rect x="283" y="88" width="7" height="9" rx="2.5" fill="none" stroke="#d8e37a" stroke-width="2.5"/>
            </svg>
          </div>
          <div style="text-align:center; padding-bottom:70px; position:relative; z-index:2">
            <button class="btn" id="parkDone">continuar</button>
          </div>
        </div>
      </div>`;

    // estrellas y luciérnagas
    const stars = [], flies = [];
    for (let k = 0; k < 90; k++) {
      const s = document.createElement("div");
      s.className = "star";
      s.style.left = Math.random() * 100 + "vw";
      s.style.top = Math.random() * 85 + "vh";
      s.style.setProperty("--o", 0.3 + Math.random() * 0.7);
      s.style.animationDelay = Math.random() * 3 + "s";
      content.appendChild(s); stars.push(s);
    }
    for (let k = 0; k < 7; k++) {
      const f = document.createElement("div");
      f.className = "firefly";
      f.style.left = 10 + Math.random() * 80 + "vw";
      f.style.top = 55 + Math.random() * 35 + "vh";
      f.style.animationDelay = Math.random() * 6 + "s";
      content.appendChild(f); flies.push(f);
    }

    const frags = content.querySelectorAll(".park-frag");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) en.target.classList.add("on"); });
    }, { threshold: 0.45 });
    frags.forEach((f) => io.observe(f));

    const moon = $("#moon");
    const onScroll = () => {
      const p = Math.min(1, player.scrollTop / Math.max(1, player.scrollHeight - innerHeight));
      stars.forEach((s, idx) => s.classList.toggle("on", idx < Math.floor(p * stars.length * 1.5)));
      flies.forEach((f, idx) => f.classList.toggle("on", p > 0.62 + idx * 0.03));
      moon.style.top = (68 - p * 55) + "vh";
    };
    onScroll();
    player.addEventListener("scroll", onScroll, { passive: true });
    cleanupFns.push(() => { io.disconnect(); player.removeEventListener("scroll", onScroll); });
    $("#parkDone").addEventListener("click", () => showQuoteCard(ep));
  }

  /* ============================================================
     E3 · SITCOM — guion a máquina + medidor de risas
     ============================================================ */
  function epSitcom(ep) {
    let scene = 0;
    content.innerHTML = `
      <div class="ep-screen" id="sitcomScreen">
        ${epHeader(ep)}
        <div class="sitcom-stage">
          <div class="neon" id="neon">risas</div>
          <div class="sitcom-script" id="script"></div>
          <div class="laugh-zone">
            <div class="laugh-meter"><div class="laugh-fill" id="fill"></div></div>
            <button class="laugh-tap" id="tap" disabled>ja ja ja</button>
          </div>
          <p class="hint">${esc(ep.hint)}</p>
        </div>
      </div>`;

    const scriptEl = $("#script"), neon = $("#neon"), fill = $("#fill"), tap = $("#tap");
    let meter = 0, typing = null, decay = null, filling = false;

    function typeScene() {
      const text = ep.scenes[scene];
      let i = 0;
      scriptEl.innerHTML = '<span id="typed"></span><span class="caret"></span>';
      const typed = $("#typed");
      clearInterval(typing);
      typing = setInterval(() => {
        typed.textContent = text.slice(0, ++i);
        if (i >= text.length) {
          clearInterval(typing);
          scriptEl.querySelector(".caret").remove();
          neon.classList.add("on");
          tap.disabled = false;
          filling = true;
        }
      }, 22);
    }

    decay = setInterval(() => {
      if (filling && meter > 0) { meter = Math.max(0, meter - 1.4); fill.style.width = meter + "%"; }
    }, 100);
    cleanupFns.push(() => { clearInterval(typing); clearInterval(decay); });

    tap.addEventListener("click", (e) => {
      if (!filling) return;
      meter = Math.min(100, meter + 13);
      fill.style.width = meter + "%";
      vibrate(10);
      // JAs
      for (let k = 0; k < 3; k++) {
        const ja = document.createElement("div");
        ja.className = "ja";
        ja.textContent = ["JA", "JAJA", "JAJAJA"][Math.floor(Math.random() * 3)];
        ja.style.left = e.clientX - 50 + Math.random() * 100 + "px";
        ja.style.top = e.clientY - 30 + Math.random() * 20 + "px";
        ja.style.fontSize = 13 + Math.random() * 16 + "px";
        ja.style.color = ["#e5c46b", "#f2ede4", "#ffdf8e"][k % 3];
        document.body.appendChild(ja);
        setTimeout(() => ja.remove(), 1400);
      }
      if (meter >= 100) {
        filling = false; tap.disabled = true; neon.classList.remove("on");
        meter = 0;
        const scr = $("#sitcomScreen");
        scr.classList.remove("shaking"); void scr.offsetWidth; scr.classList.add("shaking");
        vibrate([30, 40, 30]);
        setTimeout(() => {
          fill.style.width = "0%";
          scene++;
          if (scene < ep.scenes.length) typeScene();
          else showQuoteCard(ep);
        }, 700);
      }
    });

    typeScene();
  }

  /* ============================================================
     E4 · LOS PASILLOS — linterna táctil + contador
     ============================================================ */
  function epHall(ep) {
    const spots = [
      { x: 16, y: 20 }, { x: 58, y: 32 }, { x: 20, y: 56 }, { x: 54, y: 72 },
    ];
    content.innerHTML = `
      <div class="dark-hall" id="hall">
        <div class="hall-layer" id="layer"></div>
        <div class="hall-mask" id="mask"></div>
        <div class="hall-grain"></div>
        <div class="hall-hud" id="hud">RECUERDOS ENCONTRADOS · 0 / ${ep.wallTexts.length}</div>
        <div class="hall-hint">${esc(ep.hint)}</div>
      </div>`;
    const hall = $("#hall"), layer = $("#layer"), mask = $("#mask"), hud = $("#hud");
    const found = new Set();

    ep.wallTexts.forEach((t, idx) => {
      const el = document.createElement("div");
      el.className = "hall-text";
      el.textContent = t;
      el.style.left = spots[idx % spots.length].x + "%";
      el.style.top = spots[idx % spots.length].y + "%";
      el.dataset.idx = idx;
      layer.appendChild(el);
    });
    const exit = document.createElement("button");
    exit.className = "hall-exit";
    exit.textContent = ep.exitLabel;
    exit.style.left = "50%"; exit.style.top = "44%";
    exit.style.transform = "translateX(-50%)";
    layer.appendChild(exit);
    exit.addEventListener("click", () => showQuoteCard(ep));

    function onMove(x, y) {
      const r = hall.getBoundingClientRect();
      mask.style.setProperty("--fx", x - r.left + "px");
      mask.style.setProperty("--fy", y - r.top + "px");
      layer.querySelectorAll(".hall-text").forEach((el) => {
        const b = el.getBoundingClientRect();
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        if (Math.hypot(cx - x, cy - y) < 140 && !found.has(el.dataset.idx)) {
          found.add(el.dataset.idx);
          vibrate(20);
          hud.textContent = `RECUERDOS ENCONTRADOS · ${found.size} / ${ep.wallTexts.length}`;
        }
      });
      if (found.size >= ep.wallTexts.length && !exit.classList.contains("on")) {
        exit.classList.add("on");
        hud.textContent = "LA SALIDA APARECIÓ";
        vibrate([40, 60, 40]);
      }
    }
    const pm = (e) => onMove(e.clientX, e.clientY);
    const tm = (e) => { const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY); };
    hall.addEventListener("pointermove", pm);
    hall.addEventListener("pointerdown", pm);
    hall.addEventListener("touchmove", tm, { passive: true });
    cleanupFns.push(() => {
      hall.removeEventListener("pointermove", pm);
      hall.removeEventListener("pointerdown", pm);
      hall.removeEventListener("touchmove", tm);
    });
  }

  /* ============================================================
     E5 · SUPERVIVENCIA — inventario con cartas + chat en vivo
     ============================================================ */
  function epInventory(ep) {
    content.innerHTML = `
      <div class="ep-screen">
        ${epHeader(ep)}
        <div class="inv-hud">
          <span>equipo</span>
          <div class="bar"><i id="invBar"></i></div>
          <span id="invPct">0%</span>
        </div>
        <p class="hint" style="margin:2px 0 0">${esc(ep.hint)}</p>
        <div class="inv-grid" id="grid"></div>
        <div class="inv-detail fade-in" id="detail">&nbsp;</div>
        <div class="stream">
          <div class="stream-head"><span class="live"></span> directo · the last of us</div>
          <div class="stream-chat" id="chat"></div>
        </div>
        <div id="invDoneWrap" class="hidden" style="margin-top:22px">
          <button class="btn" id="invDone">continuar</button>
        </div>
      </div>`;

    const grid = $("#grid"), detail = $("#detail");
    const inspected = new Set();
    ep.items.forEach((it, idx) => {
      const card = document.createElement("button");
      card.className = "inv-card";
      card.innerHTML = `
        <div class="inv-inner">
          <div class="inv-face front"><span class="ico">${it.icon}</span><span>${esc(it.name)}</span></div>
          <div class="inv-face back"><span>${esc(it.name)}</span></div>
        </div>`;
      card.addEventListener("click", () => {
        card.classList.toggle("flipped");
        detail.textContent = it.text;
        detail.classList.remove("fade-in"); void detail.offsetWidth; detail.classList.add("fade-in");
        vibrate(12);
        inspected.add(idx);
        const pct = Math.round((inspected.size / ep.items.length) * 100);
        $("#invBar").style.width = pct + "%";
        $("#invPct").textContent = pct + "%";
        if (inspected.size === ep.items.length) $("#invDoneWrap").classList.remove("hidden");
      });
      grid.appendChild(card);
    });

    // chat del directo
    const chat = $("#chat");
    let ci = 0;
    const pushMsg = () => {
      const div = document.createElement("div");
      div.className = "msg";
      div.innerHTML = `<span class="u">${esc(ep.chatUser)}</span>: ${esc(ep.chat[ci % ep.chat.length])}`;
      chat.appendChild(div);
      while (chat.children.length > 6) chat.removeChild(chat.firstChild);
      ci++;
    };
    pushMsg(); pushMsg();
    const chatTimer = setInterval(pushMsg, 2200);
    cleanupFns.push(() => clearInterval(chatTimer));

    $("#invDone").addEventListener("click", () => showQuoteCard(ep));
  }

  /* ============================================================
     E6 · SIX — cuerdas de luz que suenan (WebAudio)
     ============================================================ */
  function epJam(ep) {
    let line = 0;
    const NOTES = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0]; // pentatónica Am
    content.innerHTML = `
      <div class="ep-screen">
        ${epHeader(ep)}
        <div class="jam-stage">
          <div class="vinyl"></div>
          <div class="jam-line fade-in" id="jl">${esc(ep.lines[0])}</div>
          <div class="strings" id="strings">
            ${NOTES.map(() => '<div class="string"><div class="wire"></div></div>').join("")}
          </div>
          <p class="hint">${esc(ep.hint)}</p>
          <button class="btn ghost" id="jamNext" style="margin-top:16px">siguiente ▸</button>
        </div>
      </div>`;

    // audio perezoso (iOS exige gesto del usuario)
    let actx = null;
    function pluckSound(freq) {
      try {
        if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state === "suspended") actx.resume();
        const t = actx.currentTime;
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.22, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        osc.connect(gain).connect(actx.destination);
        osc.start(t); osc.stop(t + 1);
      } catch (e) { /* sin audio: la vibración visual basta */ }
    }

    const stringsEl = $("#strings");
    const strings = [...stringsEl.querySelectorAll(".string")];
    const lastPluck = new Array(strings.length).fill(0);
    function pluckAt(clientX, clientY) {
      strings.forEach((s, i) => {
        const b = s.getBoundingClientRect();
        if (clientX >= b.left - 4 && clientX <= b.right + 4 &&
            clientY >= b.top && clientY <= b.bottom) {
          const nowMs = performance.now();
          if (nowMs - lastPluck[i] < 140) return;
          lastPluck[i] = nowMs;
          s.classList.remove("pluck"); void s.offsetWidth; s.classList.add("pluck");
          pluckSound(NOTES[i]);
          vibrate(8);
        }
      });
    }
    const pm = (e) => pluckAt(e.clientX, e.clientY);
    const tm = (e) => { const t = e.touches[0]; if (t) pluckAt(t.clientX, t.clientY); };
    stringsEl.addEventListener("pointerdown", pm);
    stringsEl.addEventListener("pointermove", (e) => { if (e.buttons || e.pressure > 0) pm(e); });
    stringsEl.addEventListener("touchmove", tm, { passive: true });
    stringsEl.addEventListener("touchstart", tm, { passive: true });
    cleanupFns.push(() => { try { actx && actx.close(); } catch (e) {} });

    const jl = $("#jl");
    $("#jamNext").addEventListener("click", () => {
      line++;
      if (line < ep.lines.length) {
        jl.textContent = ep.lines[line];
        jl.classList.remove("fade-in"); void jl.offsetWidth; jl.classList.add("fade-in");
      } else showQuoteCard(ep);
    });
  }

  /* ============================================================
     E7 · SEVEN — la revelación
     ============================================================ */
  let skipResolve = null;
  const sleep = (ms) => new Promise((r) => {
    skipResolve = r;
    setTimeout(r, ms);
  });
  const aborted = () => player.classList.contains("hidden");

  async function epFinale(ep) {
    store.markSeen(ep.num);
    content.innerHTML = `
      <div class="reveal-stage" id="stage">
        ${epHeader(ep)}
        <div class="reveal-intro" id="ri"></div>
        <div class="reveal-cards" id="rc"></div>
        <div class="phrase-final" id="pf">${esc(ep.phraseDisplay)}</div>
        <div class="final-msg hidden" id="fm"></div>
        <div class="final-cta hidden" id="cta"></div>
        <div class="credits hidden" id="credits"></div>
      </div>
      <div class="skip-hint" id="skipHint">toca para avanzar</div>`;
    const ri = $("#ri"), rc = $("#rc");
    const stage = $("#stage");
    const onTap = () => { if (skipResolve) { const r = skipResolve; skipResolve = null; r(); } };
    stage.addEventListener("pointerdown", onTap);
    cleanupFns.push(() => stage.removeEventListener("pointerdown", onTap));

    for (const lineTxt of ep.revealIntro) {
      if (aborted()) return;
      ri.textContent = lineTxt;
      ri.classList.remove("fade-in"); void ri.offsetWidth; ri.classList.add("fade-in");
      await sleep(2400);
    }
    ri.textContent = "";

    const eps = EPISODES.slice(0, 6);
    for (const e of eps) {
      if (aborted()) return;
      const card = document.createElement("div");
      card.className = "r-card fade-in";
      card.innerHTML = "“" + quoteHTML(e) + "”";
      rc.appendChild(card);
      await sleep(900);
    }
    await sleep(1500);
    if (aborted()) return;

    rc.querySelectorAll(".r-card").forEach((c) => c.classList.add("dim"));
    vibrate([20, 60, 20]);
    await sleep(3400);
    if (aborted()) return;

    $("#pf").classList.add("on");
    await sleep(3800);
    if (aborted()) return;

    const skipHint = $("#skipHint"); if (skipHint) skipHint.remove();

    const fm = $("#fm");
    fm.textContent = ep.finalMessage;
    fm.classList.remove("hidden"); fm.classList.add("fade-in");
    fm.scrollIntoView({ behavior: "smooth", block: "start" });
    await sleep(2500);
    if (aborted()) return;

    const cta = $("#cta");
    cta.textContent = CONFIG.finaleMode === "presencial"
      ? CONFIG.finalePresencialTexto
      : CONFIG.finaleMensajeTexto;
    cta.classList.remove("hidden"); cta.classList.add("fade-in");
    await sleep(2000);
    if (aborted()) return;

    const cr = $("#credits");
    cr.innerHTML = ep.credits.map((l) => esc(l) || "&nbsp;").join("<br>");
    cr.classList.remove("hidden"); cr.classList.add("fade-in");
  }

  /* ---------- Arranque de la web ---------- */
  syncTime().then(renderHome);
  setInterval(() => { if (player.classList.contains("hidden")) renderHome(); }, 60000);
})();
