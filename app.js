/* ============================================================
   LA MESA — motor de la experiencia (v3)
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
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const vibrate = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- Audio compartido (la melodía de la serie) ---------- */
  let audioCtx = null;
  function playNote(freq, delayMs = 0, dur = 0.9, vol = 0.2) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const t = audioCtx.currentTime + delayMs / 1000;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t); osc.stop(t + dur + 0.1);
    } catch (e) { /* sin audio: el gesto visual basta */ }
  }
  // La melodía de la serie: C D E G A B … y la nota que falta: C5 (llega en el E7)
  const MELODY = [261.63, 293.66, 329.63, 392.0, 440.0, 493.88];
  const MISSING_NOTE = 523.25;

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

  /* ---------- Miniaturas (artwork por episodio) ---------- */
  function artwork(num) {
    const A = {
      1: `<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg">
        <rect width="160" height="90" fill="#0d1114"/>
        <rect x="30" y="16" width="100" height="58" rx="6" fill="#14352a" stroke="#e8e6e126" stroke-width="1.5"/>
        <line x1="30" y1="45" x2="130" y2="45" stroke="#e8e6e13a" stroke-width="1.5" stroke-dasharray="4 4"/>
        <rect x="62" y="20" width="36" height="5" rx="2.5" fill="#c9563e"/>
        <rect x="60" y="66" width="40" height="5" rx="2.5" fill="#7fb4c9"/>
        <circle cx="96" cy="34" r="4.5" fill="#ffe9c9"/>
        <circle cx="96" cy="34" r="9" fill="#ffe9c9" opacity=".15"/>
      </svg>`,
      2: `<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#182036"/><stop offset="100%" stop-color="#0b0f1c"/>
        </linearGradient></defs>
        <rect width="160" height="90" fill="url(#sky2)"/>
        <circle cx="118" cy="24" r="11" fill="#f0e9d4"/>
        <circle cx="122" cy="21" r="10" fill="#182036"/>
        <circle cx="40" cy="18" r="1.4" fill="#fff" opacity=".8"/>
        <circle cx="66" cy="30" r="1.1" fill="#fff" opacity=".6"/>
        <circle cx="90" cy="14" r="1.2" fill="#fff" opacity=".7"/>
        <circle cx="26" cy="40" r="1" fill="#fff" opacity=".5"/>
        <line x1="10" y1="74" x2="150" y2="74" stroke="#3d3a55" stroke-width="2"/>
        <rect x="58" y="58" width="34" height="4" rx="2" fill="#9a8fd1"/>
        <line x1="62" y1="62" x2="62" y2="74" stroke="#9a8fd1" stroke-width="3" stroke-linecap="round"/>
        <line x1="86" y1="62" x2="86" y2="74" stroke="#9a8fd1" stroke-width="3" stroke-linecap="round"/>
        <rect x="106" y="58" width="6" height="16" rx="2.5" fill="none" stroke="#d8e37a" stroke-width="1.6"/>
        <rect x="116" y="58" width="6" height="16" rx="2.5" fill="none" stroke="#d8e37a" stroke-width="1.6"/>
      </svg>`,
      3: `<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg">
        <rect width="160" height="90" fill="#120f08"/>
        <rect x="34" y="26" width="92" height="38" rx="8" fill="none" stroke="#e5c46b" stroke-width="2.5"/>
        <rect x="34" y="26" width="92" height="38" rx="8" fill="#e5c46b12"/>
        <text x="80" y="52" text-anchor="middle" font-family="Impact, sans-serif" font-size="17" letter-spacing="4" fill="#ffe9ad">RISAS</text>
        <circle cx="34" cy="26" r="2" fill="#ffe9ad"/><circle cx="126" cy="26" r="2" fill="#ffe9ad"/>
        <circle cx="34" cy="64" r="2" fill="#ffe9ad"/><circle cx="126" cy="64" r="2" fill="#ffe9ad"/>
      </svg>`,
      4: `<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg">
        <rect width="160" height="90" fill="#060706"/>
        <polygon points="0,0 160,0 122,26 38,26" fill="#8a8f3c" opacity=".25"/>
        <polygon points="0,90 160,90 122,64 38,64" fill="#6b7030" opacity=".3"/>
        <polygon points="0,0 38,26 38,64 0,90" fill="#7a7f36" opacity=".2"/>
        <polygon points="160,0 122,26 122,64 160,90" fill="#7a7f36" opacity=".2"/>
        <rect x="38" y="26" width="84" height="38" fill="#0d0f07"/>
        <rect x="72" y="38" width="16" height="26" fill="#c9d64f" opacity=".85"/>
        <rect x="72" y="38" width="16" height="26" fill="none" stroke="#0d0f07" stroke-width="1"/>
      </svg>`,
      5: `<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg">
        <defs><radialGradient id="fog5" cx="50%" cy="60%" r="70%">
          <stop offset="0%" stop-color="#1a2b1f"/><stop offset="100%" stop-color="#0a120d"/>
        </radialGradient></defs>
        <rect width="160" height="90" fill="url(#fog5)"/>
        <text x="80" y="58" text-anchor="middle" font-size="30" opacity=".9">🧟</text>
        <text x="36" y="70" text-anchor="middle" font-size="18" opacity=".55">🧟</text>
        <text x="124" y="44" text-anchor="middle" font-size="15" opacity=".4">🧟</text>
        <circle cx="80" cy="80" r="5" fill="#ff9a3c" opacity=".9"/>
        <circle cx="80" cy="80" r="10" fill="#ff9a3c" opacity=".2"/>
      </svg>`,
      6: `<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg">
        <rect width="160" height="90" fill="#160f13"/>
        <line x1="46" y1="12" x2="46" y2="78" stroke="#d98fb0" stroke-width="2.5"/>
        <line x1="62" y1="12" x2="62" y2="78" stroke="#d98fb0" stroke-width="2.5" opacity=".85"/>
        <line x1="78" y1="12" x2="78" y2="78" stroke="#d98fb0" stroke-width="2.5" opacity=".7"/>
        <line x1="94" y1="12" x2="94" y2="78" stroke="#d98fb0" stroke-width="2.5" opacity=".55"/>
        <line x1="110" y1="12" x2="110" y2="78" stroke="#d98fb0" stroke-width="2.5" opacity=".4"/>
        <line x1="126" y1="12" x2="126" y2="78" stroke="#d98fb0" stroke-width="2.5" opacity=".3"/>
        <line x1="142" y1="12" x2="142" y2="78" stroke="#4a3a42" stroke-width="2.5" stroke-dasharray="4 5"/>
        <circle cx="22" cy="24" r="12" fill="none" stroke="#d98fb0" stroke-width="2"/>
        <circle cx="22" cy="24" r="4" fill="#d98fb0"/>
      </svg>`,
      7: `<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg">
        <defs><radialGradient id="gold7" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#3a2a16"/><stop offset="100%" stop-color="#120d06"/>
        </radialGradient></defs>
        <rect width="160" height="90" fill="url(#gold7)"/>
        <polygon points="80,10 84,38 80,45 76,38" fill="#e8a15c" opacity=".5"/>
        <polygon points="80,80 84,52 80,45 76,52" fill="#e8a15c" opacity=".5"/>
        <polygon points="35,45 73,41 80,45 73,49" fill="#e8a15c" opacity=".5"/>
        <polygon points="125,45 87,41 80,45 87,49" fill="#e8a15c" opacity=".5"/>
        <circle cx="80" cy="45" r="7" fill="#ffe9c9"/>
        <circle cx="80" cy="45" r="16" fill="#ffe9c9" opacity=".14"/>
      </svg>`,
    };
    return A[num] || "";
  }

  /* ---------- Portada ---------- */
  const list = $("#episodeList");
  let countdownTimer = null;

  function nextToWatch() {
    const seen = store.seen;
    const unlocked = EPISODES.filter(isUnlocked);
    if (!unlocked.length) return null;
    return unlocked.find((e) => !seen.includes(e.num)) || unlocked[unlocked.length - 1];
  }

  function renderHome() {
    // billboard
    $("#bbTag").textContent = CONFIG.heroTag;
    $("#bbMeta").textContent = CONFIG.heroMeta;
    $("#bbSyn").textContent = CONFIG.heroSynopsis;
    const play = $("#bbPlay");
    const nxt = nextToWatch();
    if (nxt) {
      play.disabled = false;
      play.innerHTML = store.seen.includes(nxt.num)
        ? "↺&nbsp;&nbsp;Volver a ver E" + nxt.num
        : "▶&nbsp;&nbsp;Reproducir E" + nxt.num;
      play.onclick = () => openEpisode(nxt);
    } else {
      play.disabled = true;
      play.textContent = "El estreno se acerca…";
      play.onclick = null;
    }

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
        <div class="ep-thumb">
          ${artwork(ep.num)}
          ${unlocked ? '<div class="play-ico"><span>▶</span></div>' : '<div class="ep-lock">🔒</div>'}
          ${wasSeen ? '<div class="ep-progress"><i style="width:100%"></i></div>' : ""}
        </div>
        <div class="ep-info">
          <span class="ep-kicker">Episodio ${ep.num} · ${esc(ep.genre)}</span>
          <div class="ep-toprow">
            <span class="ep-title">${unlocked ? esc(ep.title) : "· · ·"}</span>
            ${unlocked && !wasSeen ? '<span class="badge-new">nuevo</span>' : ""}
            <span class="ep-dur">${esc(ep.duration || "")}</span>
          </div>
          <div class="ep-syn">${esc(ep.synopsis)}</div>
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
      unlockedCount >= 7 ? "temporada completa" : `${unlockedCount} de 7 estrenados`;

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
    survival: epSurvival, jam: epJam, finale: epFinale,
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
     E1 · PILOTO — partido de ping pong CONTINUO.
     La pelota nunca reaparece del centro: siempre hay un saque
     del rival o un peloteo vivo. Cada devolución de ella escribe
     el siguiente capítulo arriba, sin cortar el juego.
     ============================================================ */
  function epPong(ep) {
    const TOTAL = ep.vignettes.length;
    content.innerHTML = `
      <div class="ep-screen">
        ${epHeader(ep)}
        <div class="pong-vignette fade-in" id="vg">${esc(ep.intro)}</div>
        <div class="pong-wrap" style="--ep-accent:${ep.accent}">
          <canvas class="pong-canvas" id="pongC"></canvas>
          <div class="pong-story" id="story">
            <div>
              <div class="ps-text">Desliza el dedo sobre la mesa para mover tu paleta.\nCada devolución tuya cuenta un capítulo.</div>
              <div class="ps-tap">toca para sacar</div>
            </div>
          </div>
          <div class="pong-score">
            <span id="rallyLbl">capítulos · 0 / ${TOTAL}</span>
            <span>LA MESA · E1</span>
          </div>
        </div>
      </div>`;

    const canvas = $("#pongC"), story = $("#story"), vg = $("#vg");
    const W = 400, H = 520;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.aspectRatio = W + "/" + H;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const st = {
      running: false, done: false, ending: false, raf: null,
      returns: 0, msg: "", msgUntil: 0,
      me: { x: W / 2, y: H - 42, w: 106, h: 13 },
      ai: { x: W / 2, y: 28, w: 96, h: 13 },
      ball: { x: W / 2, y: 60, r: 9, vx: 0, vy: 0 },
      trail: [],
      serveTimer: null,
    };
    const speed = () => 3.9 + st.returns * 0.32;

    function serveFromAI(delay = 0) {
      clearTimeout(st.serveTimer);
      st.serveTimer = setTimeout(() => {
        st.ball.x = st.ai.x;
        st.ball.y = st.ai.y + st.ai.h + st.ball.r + 2;
        const ang = (Math.random() * 0.7 - 0.35);
        st.ball.vx = Math.sin(ang) * speed();
        st.ball.vy = Math.cos(ang) * speed();
        st.trail = [];
      }, delay);
    }

    function flash(text, ms = 1100) { st.msg = text; st.msgUntil = performance.now() + ms; }

    function setX(clientX) {
      const r = canvas.getBoundingClientRect();
      st.me.x = clamp(((clientX - r.left) / r.width) * W, st.me.w / 2, W - st.me.w / 2);
    }
    canvas.addEventListener("pointerdown", (e) => {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      setX(e.clientX);
    });
    canvas.addEventListener("pointermove", (e) => setX(e.clientX));
    canvas.addEventListener("touchstart", (e) => { setX(e.touches[0].clientX); }, { passive: true });
    canvas.addEventListener("touchmove", (e) => { e.preventDefault(); setX(e.touches[0].clientX); }, { passive: false });

    function herReturn() {
      st.returns++;
      $("#rallyLbl").textContent = `capítulos · ${Math.min(st.returns, TOTAL)} / ${TOTAL}`;
      if (st.returns <= TOTAL) {
        vg.textContent = ep.vignettes[st.returns - 1];
        vg.classList.remove("fade-in"); void vg.offsetWidth; vg.classList.add("fade-in");
      }
      if (st.returns >= TOTAL) st.ending = true;
      vibrate(14);
    }

    function finishMatch() {
      st.running = false;
      story.innerHTML = `
        <div>
          <div class="ps-text">${esc(ep.endText)}</div>
          <div class="ps-tap">toca para ver la tarjeta del episodio</div>
        </div>`;
      story.classList.remove("hidden");
      story.onclick = () => showQuoteCard(ep);
      vibrate([20, 50, 20]);
    }

    function step() {
      if (st.done) return;
      const b = st.ball, me = st.me, ai = st.ai;

      if (st.running) {
        b.x += b.vx; b.y += b.vy;
        st.trail.push({ x: b.x, y: b.y });
        if (st.trail.length > 14) st.trail.shift();

        if (b.x < b.r + 16) { b.x = b.r + 16; b.vx = Math.abs(b.vx); }
        if (b.x > W - b.r - 16) { b.x = W - b.r - 16; b.vx = -Math.abs(b.vx); }

        // rival: sigue la pelota cuando viene hacia él, si no vuelve al centro
        if (b.vy < 0) ai.x += clamp((b.x - ai.x) * 0.18, -6.5, 6.5);
        else ai.x += clamp((W / 2 - ai.x) * 0.03, -2, 2);
        ai.x = clamp(ai.x, ai.w / 2 + 14, W - ai.w / 2 - 14);

        // golpe del rival
        if (b.vy < 0 && b.y - b.r <= ai.y + ai.h && b.y > ai.y - 8 &&
            Math.abs(b.x - ai.x) < ai.w / 2 + b.r + 4) {
          if (st.ending) { finishMatch(); }
          else {
            b.y = ai.y + ai.h + b.r;
            b.vy = speed();
            b.vx = clamp(b.vx + (b.x - ai.x) * 0.045, -4.6, 4.6);
            vibrate(6);
          }
        }
        // golpe de ella
        if (b.vy > 0 && b.y + b.r >= me.y && b.y < me.y + me.h + 16 &&
            Math.abs(b.x - me.x) < me.w / 2 + b.r + 5) {
          b.y = me.y - b.r;
          b.vy = -(speed() + 0.5);
          b.vx = clamp(b.vx + (b.x - me.x) * 0.055, -5, 5);
          herReturn();
        }
        // se le pasó → saque nuevo del rival (nunca del centro)
        if (b.y > H + 26) {
          flash("casi — saque del rival");
          b.vx = 0; b.vy = 0; b.y = -100;
          serveFromAI(650);
        }
      }

      /* ---- dibujo ---- */
      ctx.clearRect(0, 0, W, H);
      // mesa
      rr(ctx, 14, 14, W - 28, H - 28, 14);
      ctx.fillStyle = "#14352a"; ctx.fill();
      ctx.strokeStyle = "#e8e6e130"; ctx.lineWidth = 2; ctx.stroke();
      // red
      ctx.setLineDash([7, 7]); ctx.strokeStyle = "#e8e6e150";
      ctx.beginPath(); ctx.moveTo(14, H / 2); ctx.lineTo(W - 14, H / 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "#e8e6e110";
      ctx.beginPath(); ctx.moveTo(W / 2, 14); ctx.lineTo(W / 2, H - 14); ctx.stroke();
      // estela
      st.trail.forEach((t, i) => {
        ctx.globalAlpha = (i / st.trail.length) * 0.3;
        ctx.fillStyle = "#ffe9c9";
        ctx.beginPath(); ctx.arc(t.x, t.y, 5.5, 0, 7); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // paletas
      rr(ctx, ai.x - ai.w / 2, ai.y, ai.w, ai.h, 6); ctx.fillStyle = "#c9563e"; ctx.fill();
      ctx.shadowColor = "#7fb4c9"; ctx.shadowBlur = 16;
      rr(ctx, me.x - me.w / 2, me.y, me.w, me.h, 6); ctx.fillStyle = "#7fb4c9"; ctx.fill();
      ctx.shadowBlur = 0;
      // pelota
      if (st.ball.y > -50) {
        ctx.fillStyle = "#fff4dd";
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
      }
      // mensaje flotante
      if (st.msg && performance.now() < st.msgUntil) {
        ctx.fillStyle = "#e8e6e199"; ctx.font = "600 13px Inter, sans-serif"; ctx.textAlign = "center";
        ctx.fillText(st.msg, W / 2, H / 2 - 14);
      }

      st.raf = requestAnimationFrame(step);
    }
    function rr(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r); c.closePath();
    }

    story.onclick = () => {
      story.classList.add("hidden");
      st.running = true;
      serveFromAI(150);
    };

    st.raf = requestAnimationFrame(step);
    cleanupFns.push(() => { st.done = true; cancelAnimationFrame(st.raf); clearTimeout(st.serveTimer); });
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
              <line x1="10" y1="132" x2="310" y2="132" stroke="#63635e" stroke-width="2" stroke-linecap="round"/>
              <line x1="80" y1="132" x2="80" y2="52" stroke="#9a8fd1" stroke-width="4" stroke-linecap="round"/>
              <line x1="80" y1="60" x2="130" y2="78" stroke="#9a8fd1" stroke-width="4" stroke-linecap="round"/>
              <rect x="122" y="72" width="26" height="9" rx="4" fill="#9a8fd1"/>
              <line x1="80" y1="90" x2="46" y2="112" stroke="#9a8fd1" stroke-width="4" stroke-linecap="round"/>
              <rect x="30" y="106" width="24" height="9" rx="4" fill="#9a8fd1"/>
              <circle cx="80" cy="52" r="5" fill="#9a8fd1"/>
              <rect x="168" y="96" width="70" height="8" rx="4" fill="#7d739e"/>
              <line x1="176" y1="104" x2="176" y2="132" stroke="#7d739e" stroke-width="4" stroke-linecap="round"/>
              <line x1="230" y1="104" x2="230" y2="132" stroke="#7d739e" stroke-width="4" stroke-linecap="round"/>
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
          const c = scriptEl.querySelector(".caret"); if (c) c.remove();
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
     E5 · SUPERVIVENCIA — LA HORDA. Rondas de infectados que
     avanzan hacia el campamento; ella los elimina tocándolos.
     Cada ronda limpia asegura un suministro con su historia.
     ============================================================ */
  function epSurvival(ep) {
    content.innerHTML = `
      <div class="ep-screen">
        ${epHeader(ep)}
        <div class="surv-hud">
          <span id="waveLbl">ronda 1 / ${ep.waves.length}</span>
          <span>·</span>
          <span id="leftLbl">quedan ${ep.waves[0].count}</span>
        </div>
        <p class="hint" style="margin:0 0 12px">${esc(ep.hint)}</p>
        <div class="arena" id="arena">
          <div class="camp">🔥</div>
        </div>
        <div class="stream">
          <div class="stream-head"><span class="live"></span> directo · the last of us</div>
          <div class="stream-chat" id="chat"></div>
        </div>
      </div>`;

    const arena = $("#arena"), waveLbl = $("#waveLbl"), leftLbl = $("#leftLbl");
    let wave = 0, zombies = [], mover = null, spawner = null, alive = 0, spawned = 0;

    function arenaSize() { const r = arena.getBoundingClientRect(); return { w: r.width || 440, h: r.height || 330 }; }

    function spawnZombie(speedBase) {
      const { w, h } = arenaSize();
      const side = Math.floor(Math.random() * 4);
      let x, y;
      if (side === 0) { x = Math.random() * w; y = -20; }
      else if (side === 1) { x = w + 20; y = Math.random() * h; }
      else if (side === 2) { x = Math.random() * w; y = h + 20; }
      else { x = -20; y = Math.random() * h; }
      const el = document.createElement("button");
      el.className = "zombie";
      el.textContent = ep.enemy;
      el.setAttribute("aria-label", "infectado");
      arena.appendChild(el);
      const z = { el, x, y, speed: speedBase * (0.85 + Math.random() * 0.4), dead: false, wob: Math.random() * 6.28 };
      el.style.left = x + "px"; el.style.top = y + "px";
      const kill = (ev) => {
        ev.preventDefault();
        if (z.dead) return;
        z.dead = true; alive--;
        el.classList.add("dead");
        vibrate(18);
        const fx = document.createElement("div");
        fx.className = "hit-fx";
        fx.textContent = ["+1", "LIMPIO", "BIEN"][Math.floor(Math.random() * 3)];
        fx.style.left = z.x + "px"; fx.style.top = z.y + "px";
        arena.appendChild(fx);
        setTimeout(() => { el.remove(); fx.remove(); }, 650);
        leftLbl.textContent = "quedan " + (alive + (waveTotal - spawned));
        checkWave();
      };
      el.addEventListener("pointerdown", kill);
      el.addEventListener("touchstart", kill, { passive: false });
      zombies.push(z);
      alive++;
    }

    let waveTotal = 0;
    function startWave() {
      const cfg = ep.waves[wave];
      waveTotal = cfg.count; spawned = 0; alive = 0; zombies = [];
      waveLbl.textContent = `ronda ${wave + 1} / ${ep.waves.length}`;
      leftLbl.textContent = "quedan " + cfg.count;
      const speedBase = 0.45 + wave * 0.14;
      spawner = setInterval(() => {
        if (spawned >= cfg.count) { clearInterval(spawner); return; }
        spawnZombie(speedBase);
        spawned++;
      }, 480);
      mover = setInterval(() => {
        const { w, h } = arenaSize();
        const cx = w / 2, cy = h * 0.55;
        zombies.forEach((z) => {
          if (z.dead) return;
          z.wob += 0.12;
          const dx = cx - z.x, dy = cy - z.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 34) {
            // llegó al fuego: retrocede empujado por las llamas (sin castigo)
            z.x -= (dx / d) * 46; z.y -= (dy / d) * 46;
            arena.classList.remove("arena-shake"); void arena.offsetWidth; arena.classList.add("arena-shake");
            vibrate(24);
          } else {
            z.x += (dx / d) * z.speed + Math.sin(z.wob) * 0.5;
            z.y += (dy / d) * z.speed + Math.cos(z.wob * 0.8) * 0.4;
          }
          z.el.style.left = z.x + "px";
          z.el.style.top = z.y + "px";
        });
      }, 40);
    }

    function checkWave() {
      if (alive > 0 || spawned < waveTotal) return;
      clearInterval(mover); clearInterval(spawner);
      const cfg = ep.waves[wave];
      const last = wave >= ep.waves.length - 1;
      const panel = document.createElement("div");
      panel.className = "supply";
      panel.innerHTML = `
        <div>
          <div class="sp-tag">ronda limpia · suministro asegurado</div>
          <div class="sp-ico">${cfg.icon}</div>
          <div class="sp-name">${esc(cfg.name)}</div>
          <div class="sp-text">${esc(cfg.text)}</div>
          <button class="btn" id="nextWave">${last ? "ver la tarjeta del episodio" : "siguiente ronda ▸"}</button>
        </div>`;
      arena.appendChild(panel);
      $("#nextWave").addEventListener("click", () => {
        if (last) { showQuoteCard(ep); return; }
        panel.remove();
        wave++;
        startWave();
      });
    }

    // chat del directo
    const chat = $("#chat");
    let ci = 0;
    const pushMsg = () => {
      const div = document.createElement("div");
      div.className = "msg";
      div.innerHTML = `<span class="u">${esc(ep.chatUser)}</span>: ${esc(ep.chat[ci % ep.chat.length])}`;
      chat.appendChild(div);
      while (chat.children.length > 5) chat.removeChild(chat.firstChild);
      ci++;
    };
    pushMsg(); pushMsg();
    const chatTimer = setInterval(pushMsg, 2400);

    cleanupFns.push(() => { clearInterval(mover); clearInterval(spawner); clearInterval(chatTimer); });
    startWave();
  }

  /* ============================================================
     E6 · SIX — LA MELODÍA INCOMPLETA.
     Seis cuerdas afinadas para una melodía que sube y no resuelve:
     le falta su última nota. La séptima cuerda está bloqueada
     ("mañana"). La nota que falta suena recién en el E7, cuando
     la frase se revela. El sonido ES la historia.
     ============================================================ */
  function epJam(ep) {
    content.innerHTML = `
      <div class="ep-screen">
        ${epHeader(ep)}
        <div class="jam-stage">
          <p class="jam-intro fade-in">${esc(ep.introLines[0])}</p>
          <p class="jam-intro fade-in" style="animation-delay:.5s">${esc(ep.introLines[1])}</p>
          <div class="strings" id="strings">
            ${MELODY.map((_, i) => `
              <div class="string" data-i="${i}">
                <div class="wire"></div>
                <span class="num">${i + 1}</span>
              </div>`).join("")}
            <div class="string ghost" id="ghost">
              <div class="wire"></div>
              <span class="num">7</span>
            </div>
          </div>
          <p class="hint">${esc(ep.hint)}</p>
          <div class="jam-reveal" id="jamReveal"></div>
          <div class="jam-seventh hidden" id="seventh">${esc(ep.seventhLabel)}</div>
          <div class="hidden" id="jamDoneWrap" style="margin-top:18px">
            <button class="btn" id="jamDone">ver la tarjeta del episodio</button>
          </div>
        </div>
      </div>`;

    const stringsEl = $("#strings");
    const strings = [...stringsEl.querySelectorAll(".string:not(.ghost)")];
    const ghost = $("#ghost");
    const played = new Set();
    const lastPluck = new Array(strings.length).fill(0);
    let revealed = false;

    function pluck(i) {
      const nowMs = performance.now();
      if (nowMs - lastPluck[i] < 150) return;
      lastPluck[i] = nowMs;
      const s = strings[i];
      s.classList.remove("pluck"); void s.offsetWidth; s.classList.add("pluck");
      s.classList.add("played");
      playNote(MELODY[i], 0, 0.9, 0.22);
      vibrate(8);
      played.add(i);
      if (played.size === strings.length && !revealed) {
        revealed = true;
        setTimeout(revealIncomplete, 900);
      }
    }

    function denyGhost() {
      ghost.classList.remove("deny"); void ghost.offsetWidth; ghost.classList.add("deny");
      const old = ghost.querySelector(".ghost-tip"); if (old) old.remove();
      const tip = document.createElement("span");
      tip.className = "ghost-tip";
      tip.textContent = ep.lockedStringHint;
      ghost.appendChild(tip);
      setTimeout(() => tip.remove(), 1400);
      vibrate([10, 30, 10]);
    }

    async function revealIncomplete() {
      const jr = $("#jamReveal");
      // vuelve a tocar la melodía completa (las 6), para que se escuche la subida…
      MELODY.forEach((f, i) => playNote(f, i * 240, 0.7, 0.18));
      await new Promise((r) => setTimeout(r, MELODY.length * 240 + 500));
      if (!$("#jamReveal")) return;
      jr.innerHTML = `<span class="fade-in">${esc(ep.afterStrum)}</span>`;
      await new Promise((r) => setTimeout(r, 2400));
      if (!$("#jamReveal")) return;
      jr.innerHTML += `<span class="jr2 fade-in">${esc(ep.afterStrum2)}</span>`;
      await new Promise((r) => setTimeout(r, 2000));
      if (!$("#seventh")) return;
      $("#seventh").classList.remove("hidden");
      $("#seventh").classList.add("fade-in");
      $("#jamDoneWrap").classList.remove("hidden");
    }

    function hitTest(clientX, clientY) {
      strings.forEach((s, i) => {
        const b = s.getBoundingClientRect();
        if (clientX >= b.left - 5 && clientX <= b.right + 5 &&
            clientY >= b.top && clientY <= b.bottom) pluck(i);
      });
      const g = ghost.getBoundingClientRect();
      if (clientX >= g.left - 5 && clientX <= g.right + 5 &&
          clientY >= g.top && clientY <= g.bottom) denyGhost();
    }
    const pm = (e) => hitTest(e.clientX, e.clientY);
    const tm = (e) => { const t = e.touches[0]; if (t) hitTest(t.clientX, t.clientY); };
    stringsEl.addEventListener("pointerdown", pm);
    stringsEl.addEventListener("pointermove", (e) => { if (e.buttons || e.pressure > 0) pm(e); });
    stringsEl.addEventListener("touchstart", tm, { passive: true });
    stringsEl.addEventListener("touchmove", tm, { passive: true });

    $("#jamDone").addEventListener("click", () => showQuoteCard(ep));
  }

  /* ============================================================
     E7 · SEVEN — la revelación. Las tarjetas vuelven, las palabras
     se encienden, la frase se arma… y la melodía por fin resuelve:
     suena la nota que faltaba desde el E6.
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
        <div class="note-line" id="noteLine">${esc(ep.noteLine)}</div>
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

    // La frase — y la melodía que por fin resuelve (la nota que faltaba)
    $("#pf").classList.add("on");
    MELODY.forEach((f, i) => playNote(f, i * 220, 0.6, 0.15));
    playNote(MISSING_NOTE, MELODY.length * 220 + 80, 2.2, 0.22);
    await sleep(2600);
    if (aborted()) return;
    $("#noteLine").classList.add("on");
    await sleep(2600);
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

  /* ---------- Arranque ---------- */
  syncTime().then(renderHome);
  setInterval(() => { if (player.classList.contains("hidden")) renderHome(); }, 60000);
})();
