/* ============================================================
   LA MESA — motor de la experiencia
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

  /* ---------- Hora confiable (anti cambio de reloj) ----------
     Pide la hora al servidor (cabecera Date) y guarda el desfase
     con el reloj del dispositivo. Si falla (p. ej. abriendo el
     archivo localmente), usa la hora del dispositivo. */
  let serverOffset = 0; // serverNow - deviceNow (ms)
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

  // Envuelve la palabra oculta de la cita en un span.kw (invisible a simple vista)
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

    // Cuenta regresiva en el siguiente episodio bloqueado
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

    // Progreso
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

  function openEpisode(ep) {
    cleanupFns.forEach((f) => f()); cleanupFns = [];
    content.innerHTML = "";
    player.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    player.scrollTop = 0;
    ({ 1: epPong, 2: epSitcom, 3: epHall, 4: epPark, 5: epInventory, 6: epJam, 7: epFinale }[ep.num])(ep);
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

  /* Tarjeta de cierre + teaser (final común de cada episodio) */
  function showQuoteCard(ep) {
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

  /* ---------- E1 · Piloto (ping pong) ---------- */
  function epPong(ep) {
    let i = -1;
    content.innerHTML = `
      <div class="ep-screen">
        ${epHeader(ep)}
        <div class="pong-vignette fade-in" id="vg">Todo empezó con una pelota.</div>
        <div class="pong-stage">
          <div class="pong-table"></div><div class="pong-net"></div>
          <button class="pong-ball" id="ball" aria-label="Golpear la pelota"></button>
        </div>
        <div class="pong-count" id="cnt">toca la pelota</div>
      </div>`;
    const vg = $("#vg"), cnt = $("#cnt"), ball = $("#ball");
    ball.addEventListener("click", () => {
      i++;
      if (i < ep.vignettes.length) {
        vg.textContent = ep.vignettes[i];
        vg.classList.remove("fade-in"); void vg.offsetWidth; vg.classList.add("fade-in");
        cnt.textContent = `${i + 1} / ${ep.vignettes.length}`;
        ball.style.animationDuration = 1.6 - i * 0.18 + "s";
      } else {
        showQuoteCard(ep);
      }
    });
  }

  /* ---------- E2 · Sitcom (botón de risas) ---------- */
  function epSitcom(ep) {
    let i = 0;
    content.innerHTML = `
      <div class="ep-screen" id="sitcomScreen">
        ${epHeader(ep)}
        <div class="sitcom-script fade-in" id="scene"></div>
        <button class="laugh-btn" id="laugh">${esc(ep.laughButtonLabel)} 😂</button>
        <p class="hint">el público (tú) controla las risas</p>
      </div>`;
    const scene = $("#scene");
    const paint = () => {
      const txt = ep.scenes[i];
      scene.innerHTML = i === 0 ? `<span class="slate">${esc(txt)}</span>` : esc(txt);
      scene.classList.remove("fade-in"); void scene.offsetWidth; scene.classList.add("fade-in");
    };
    paint();
    $("#laugh").addEventListener("click", (e) => {
      // lluvia de JAs
      for (let k = 0; k < 8; k++) {
        const ja = document.createElement("div");
        ja.className = "ja";
        ja.textContent = ["JA", "JAJA", "JAJAJA"][k % 3];
        ja.style.left = e.clientX - 60 + Math.random() * 120 + "px";
        ja.style.top = e.clientY - 20 + Math.random() * 30 + "px";
        ja.style.fontSize = 14 + Math.random() * 18 + "px";
        ja.style.color = ["#e5c46b", "#f2ede4", "#d98fb0"][k % 3];
        ja.style.animationDelay = Math.random() * 0.25 + "s";
        document.body.appendChild(ja);
        setTimeout(() => ja.remove(), 1600);
      }
      const scr = $("#sitcomScreen");
      scr.classList.remove("shaking"); void scr.offsetWidth; scr.classList.add("shaking");
      i++;
      if (i < ep.scenes.length) paint();
      else showQuoteCard(ep);
    });
  }

  /* ---------- E3 · Pasillo oscuro (linterna) ---------- */
  function epHall(ep) {
    const spots = [
      { x: 22, y: 20 }, { x: 68, y: 34 }, { x: 25, y: 55 }, { x: 62, y: 70 },
    ];
    content.innerHTML = `
      <div class="dark-hall" id="hall">
        <div class="hall-layer" id="layer"></div>
        <div class="hall-mask" id="mask"></div>
        <div class="hall-hint">mueve el dedo para iluminar los pasillos</div>
      </div>`;
    const hall = $("#hall"), layer = $("#layer"), mask = $("#mask");
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
    exit.style.left = "38%"; exit.style.top = "42%";
    layer.appendChild(exit);
    exit.addEventListener("click", () => showQuoteCard(ep));

    function onMove(x, y) {
      const r = hall.getBoundingClientRect();
      mask.style.setProperty("--fx", x - r.left + "px");
      mask.style.setProperty("--fy", y - r.top + "px");
      layer.querySelectorAll(".hall-text").forEach((el) => {
        const b = el.getBoundingClientRect();
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        if (Math.hypot(cx - x, cy - y) < 130) found.add(el.dataset.idx);
      });
      if (found.size >= ep.wallTexts.length) exit.classList.add("on");
    }
    const pm = (e) => onMove(e.clientX, e.clientY);
    const tm = (e) => { const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY); };
    hall.addEventListener("pointermove", pm);
    hall.addEventListener("touchmove", tm, { passive: true });
    cleanupFns.push(() => { hall.removeEventListener("pointermove", pm); hall.removeEventListener("touchmove", tm); });
  }

  /* ---------- E4 · Parque (scroll nocturno) ---------- */
  function epPark(ep) {
    content.innerHTML = `
      <div class="park">
        <div class="park-sky" id="sky"></div>
        <div class="park-scroll">
          ${epHeader(ep)}
          <p class="hint" style="text-align:center">desliza despacio</p>
          ${ep.fragments.map((f) => `<div class="park-frag">${esc(f)}</div>`).join("")}
          <div class="park-scene">🌙&nbsp;🏋️&nbsp;🥤</div>
          <div style="text-align:center; padding-bottom:60px">
            <button class="btn" id="parkDone">continuar</button>
          </div>
        </div>
      </div>`;
    // estrellas
    const stars = [];
    for (let k = 0; k < 70; k++) {
      const s = document.createElement("div");
      s.className = "star";
      s.style.left = Math.random() * 100 + "vw";
      s.style.top = Math.random() * 90 + "vh";
      s.style.setProperty("--o", 0.3 + Math.random() * 0.7);
      s.style.animationDelay = Math.random() * 3 + "s";
      content.appendChild(s);
      stars.push(s);
    }
    const frags = content.querySelectorAll(".park-frag");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) en.target.classList.add("on"); });
    }, { threshold: 0.5 });
    frags.forEach((f) => io.observe(f));
    const onScroll = () => {
      const p = player.scrollTop / (player.scrollHeight - innerHeight);
      const lit = Math.floor(p * stars.length * 1.4);
      stars.forEach((s, idx) => s.classList.toggle("on", idx < lit));
    };
    player.addEventListener("scroll", onScroll, { passive: true });
    cleanupFns.push(() => { io.disconnect(); player.removeEventListener("scroll", onScroll); });
    $("#parkDone").addEventListener("click", () => showQuoteCard(ep));
  }

  /* ---------- E5 · Inventario ---------- */
  function epInventory(ep) {
    content.innerHTML = `
      <div class="ep-screen">
        ${epHeader(ep)}
        <p class="hint">revisa el inventario · toca cada objeto</p>
        <div class="inv-grid" id="grid"></div>
        <div class="inv-detail fade-in" id="detail">…</div>
        <div id="invDoneWrap" class="hidden" style="margin-top:20px">
          <button class="btn" id="invDone">continuar</button>
        </div>
      </div>`;
    const grid = $("#grid"), detail = $("#detail");
    const inspected = new Set();
    ep.items.forEach((it, idx) => {
      const b = document.createElement("button");
      b.className = "inv-item";
      b.innerHTML = `<span class="ico">${it.icon}</span><span>${esc(it.name)}</span>`;
      b.addEventListener("click", () => {
        detail.textContent = it.text;
        detail.classList.remove("fade-in"); void detail.offsetWidth; detail.classList.add("fade-in");
        b.classList.add("inspected");
        inspected.add(idx);
        if (inspected.size === ep.items.length) $("#invDoneWrap").classList.remove("hidden");
      });
      grid.appendChild(b);
    });
    $("#invDone").addEventListener("click", () => showQuoteCard(ep));
  }

  /* ---------- E6 · Jam (ecualizador) ---------- */
  function epJam(ep) {
    let i = 0;
    const BARS = 18;
    content.innerHTML = `
      <div class="ep-screen">
        ${epHeader(ep)}
        <div class="jam-line fade-in" id="jl">${esc(ep.lines[0])}</div>
        <div class="eq" id="eq">${'<div class="eq-bar"></div>'.repeat(BARS)}</div>
        <p class="hint">pasa el dedo por el ecualizador</p>
        <button class="btn ghost" id="jamNext" style="margin-top:18px">siguiente ▸</button>
      </div>`;
    const bars = [...content.querySelectorAll(".eq-bar")];
    let boost = -1;
    const anim = setInterval(() => {
      bars.forEach((b, idx) => {
        let h = 12 + Math.random() * 55;
        if (boost >= 0) h += Math.max(0, 45 - Math.abs(idx - boost) * 12);
        b.style.height = Math.min(100, h) + "%";
      });
    }, 180);
    cleanupFns.push(() => clearInterval(anim));
    const eq = $("#eq");
    const onPtr = (e) => {
      const r = eq.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      boost = Math.floor((x / r.width) * BARS);
    };
    eq.addEventListener("pointermove", onPtr);
    eq.addEventListener("touchmove", onPtr, { passive: true });
    eq.addEventListener("pointerleave", () => (boost = -1));
    const jl = $("#jl");
    $("#jamNext").addEventListener("click", () => {
      i++;
      if (i < ep.lines.length) {
        jl.textContent = ep.lines[i];
        jl.classList.remove("fade-in"); void jl.offsetWidth; jl.classList.add("fade-in");
      } else showQuoteCard(ep);
    });
  }

  /* ---------- E7 · Final de temporada (revelación) ---------- */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // Si Ariana cierra el reproductor a mitad de la revelación, se detiene sin errores
  const aborted = () => player.classList.contains("hidden");
  async function epFinale(ep) {
    store.markSeen(ep.num);
    content.innerHTML = `
      <div class="reveal-stage">
        ${epHeader(ep)}
        <div class="reveal-intro" id="ri"></div>
        <div class="reveal-cards" id="rc"></div>
        <div class="phrase-final" id="pf">${esc(ep.phraseDisplay)}</div>
        <div class="final-msg hidden" id="fm"></div>
        <div class="final-cta hidden" id="cta"></div>
        <div class="credits hidden" id="credits"></div>
      </div>`;
    const ri = $("#ri"), rc = $("#rc");

    for (const line of ep.revealIntro) {
      if (aborted()) return;
      ri.textContent = line;
      ri.classList.remove("fade-in"); void ri.offsetWidth; ri.classList.add("fade-in");
      await sleep(2300);
    }
    ri.textContent = "";

    // Las 6 tarjetas vuelven
    const eps = EPISODES.slice(0, 6);
    for (const e of eps) {
      if (aborted()) return;
      const card = document.createElement("div");
      card.className = "r-card fade-in";
      card.innerHTML = "“" + quoteHTML(e) + "”";
      rc.appendChild(card);
      await sleep(900);
    }
    await sleep(1400);
    if (aborted()) return;

    // Todo se apaga menos las palabras
    rc.querySelectorAll(".r-card").forEach((c) => c.classList.add("dim"));
    await sleep(3200);
    if (aborted()) return;

    // La frase
    $("#pf").classList.add("on");
    await sleep(3600);
    if (aborted()) return;

    // Mensaje final de Dylan
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

  /* ---------- Arranque de la experiencia ---------- */
  syncTime().then(renderHome);
  // Refresca el estado de bloqueo cada minuto por si pasa la medianoche con la web abierta
  setInterval(() => { if (player.classList.contains("hidden")) renderHome(); }, 60000);
})();
