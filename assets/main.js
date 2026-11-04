// Smooth scroll, the live age clock, the Passport map and the page's signature moments. All copy lives in index.html.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const once = (trigger, start = 'top 85%') => ({ trigger, start, once: true });
const flag = cc => `https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/flags/4x3/${cc}.svg`;

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, MotionPathPlugin, Draggable, InertiaPlugin, CustomEase, CustomWiggle, CustomBounce);
CustomWiggle.create('shake', { wiggles: 8, type: 'easeOut' });
CustomWiggle.create('swing', { wiggles: 5, type: 'easeOut' });
CustomBounce.create('drop', { strength: .55, squash: 2 });
CustomEase.create('snap', 'M0,0 C0.18,0 0.08,1 1,1');

if (!reduce) {
  const lenis = new Lenis({ anchors: true }); // syncTouch stays off, so phones keep native scroll
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- age clock ---------- */
const UAE = 4 * 3600e3; // UTC+4 all year, no daylight saving
const BIRTH = Date.UTC(2000, 9, 27) - UAE; // 00:00 UAE on 27 Oct 2000; the birth hour is unknown, so the clock starts at midnight
const bday = y => Date.UTC(y, 9, 27) - UAE;
function age(now) {
  const uae = new Date(now + UAE);
  let y = uae.getUTCFullYear();
  if (now < bday(y)) y--;
  const last = bday(y), next = bday(y + 1);
  return { years: y - 2000, exact: y - 2000 + (now - last) / (next - last), last, next, toNext: next - now,
    isBirthday: uae.getUTCMonth() === 9 && uae.getUTCDate() === 27 };
}
const pad = n => String(n).padStart(2, '0');
const nf = (v, d) => v.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtDate = ms => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dubai' });
const uaeClock = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' });
const UNITS = [
  ['years', a => a.exact.toFixed(8)],
  ['days', (a, ms) => nf(ms / 864e5, 4)],
  ['hours', (a, ms) => nf(ms / 36e5, 2)],
  ['seconds', (a, ms) => Math.floor(ms / 1e3).toLocaleString('en-GB')],
];
const MILESTONES = [[BIRTH + 1e4 * 864e5, 'Day 10,000'], [BIRTH + 1e12, 'Second 1,000,000,000'], [BIRTH + 15e3 * 864e5, 'Day 15,000']];

const odo = $('[data-odo]'), stub = $('[data-stub]');
let unit = 0, cols = [], shape = '';
function setOdo(str, animate) {
  const s = str.replace(/\d/g, '0');
  if (s !== shape) { // rebuild only when the layout of digits and separators changes
    shape = s;
    odo.innerHTML = [...str].map(ch => /\d/.test(ch)
      ? `<span class="dg"><span class="col">${[...'0123456789'].map(d => `<span>${d}</span>`).join('')}</span></span>`
      : `<span>${ch}</span>`).join('');
    cols = $$('.col', odo).map(el => ({ el, d: -1 }));
    animate = false;
  }
  let i = 0;
  for (const ch of str) {
    if (!/\d/.test(ch)) continue;
    const c = cols[i++], d = +ch;
    if (c.d === d) continue;
    c.d = d;
    animate ? gsap.to(c.el, { yPercent: -10 * d, duration: .35, ease: 'power2.out', overwrite: true }) : gsap.set(c.el, { yPercent: -10 * d });
  }
}
let lastSecond = -1, lastMinute = -1;
function tick() {
  const now = Date.now(), a = age(now), ms = now - BIRTH;
  setOdo(UNITS[unit][1](a, ms), !reduce);
  const sec = Math.floor(now / 1e3);
  if (sec === lastSecond) return;
  lastSecond = sec;
  const t = Math.floor(a.toNext / 1e3), d = Math.floor(t / 86400), h = Math.floor(t / 3600) % 24, m = Math.floor(t / 60) % 60, s = t % 60;
  $('[data-lvl-now]').textContent = `LVL ${a.years}`;
  $('[data-lvl-next]').textContent = `LVL ${a.years + 1}`;
  $('[data-seal]').textContent = a.years;
  stub.style.setProperty('--xp', ((now - a.last) / (a.next - a.last)).toFixed(4));
  stub.classList.toggle('is-bday', a.isBirthday);
  const line = $('[data-cd-line]');
  if (a.isBirthday) line.textContent = `It's my birthday today. Level ${a.years} unlocked.`;
  else if (!line.querySelector('[data-cd]')) line.innerHTML = `Level ${a.years + 1} unlocks in <b data-cd></b>`;
  else line.firstChild.textContent = `Level ${a.years + 1} unlocks in `;
  const cd = $('[data-cd]'); if (cd) cd.textContent = `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  $$('[data-age-mini]').forEach(el => el.textContent = a.exact.toFixed(4));
  $$('[data-uae-time]').forEach(el => el.textContent = uaeClock());
  const short = $('[data-cd-short]'); if (short) short.textContent = `${d}d`;
  const mile = MILESTONES.find(x => x[0] > now);
  $('[data-mile]').textContent = mile ? `${mile[1]} lands on ${fmtDate(mile[0])}.` : '';
  const min = Math.floor(sec / 60);
  if (min !== lastMinute) { lastMinute = min; $('[data-age-sr]').textContent = `I'm ${a.years}. My next birthday is ${fmtDate(a.next)}.`; }
}
tick();
setInterval(tick, reduce ? 1000 : 100);
$('[data-unit]').addEventListener('click', e => {
  unit = (unit + 1) % UNITS.length;
  const name = UNITS[unit][0];
  reduce ? (e.currentTarget.textContent = name) : gsap.to(e.currentTarget, { duration: .5, scrambleText: { text: name, chars: 'lowerCase', speed: .6 } });
  tick();
});

/* ---------- click sparks (ReactBits Click Spark, on canvas) ---------- */
const sparkCv = $('.sparks'), sctx = sparkCv.getContext('2d');
let sparks = [], sparking = false;
function sizeSparks() { sparkCv.width = innerWidth * devicePixelRatio; sparkCv.height = innerHeight * devicePixelRatio; }
sizeSparks(); addEventListener('resize', sizeSparks);
function drawSparks() {
  sctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  sctx.clearRect(0, 0, innerWidth, innerHeight);
  sparks = sparks.filter(s => ++s.t < 28);
  for (const s of sparks) {
    const p = s.t / 28, d = s.sp * s.t, l = s.len * (1 - p);
    sctx.strokeStyle = s.c; sctx.lineWidth = 3; sctx.lineCap = 'round';
    sctx.beginPath(); sctx.moveTo(s.x + Math.cos(s.a) * d, s.y + Math.sin(s.a) * d);
    sctx.lineTo(s.x + Math.cos(s.a) * (d + l), s.y + Math.sin(s.a) * (d + l)); sctx.stroke();
  }
  if (!sparks.length) { gsap.ticker.remove(drawSparks); sparking = false; }
}
function spark(x, y, n = 10) {
  if (reduce) return;
  const colors = ['#FFC933', '#FF4B2B', '#4FD1B5', '#1F3A5F'];
  for (let i = 0; i < n; i++) sparks.push({ x, y, t: 0, a: i / n * Math.PI * 2 + Math.random() * .3, c: colors[i % 4], len: 10 + Math.random() * 14, sp: 3 + Math.random() * 3 });
  if (!sparking) { sparking = true; gsap.ticker.add(drawSparks); }
}
$('.tk-arcade').addEventListener('pointerdown', e => spark(e.clientX, e.clientY));
document.addEventListener('pointerdown', e => { if (stub.classList.contains('is-bday') && !e.target.closest('.tk-arcade')) spark(e.clientX, e.clientY, 12); });

// type c-r-7 anywhere for a celebration
let typed = '';
const toast = $('[data-toast]');
document.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea')) return;
  typed = (typed + e.key.toLowerCase()).slice(-3);
  if (typed !== 'cr7') return;
  for (let i = 0; i < 4; i++) setTimeout(() => spark(innerWidth / 2 + (Math.random() - .5) * 300, innerHeight / 2 + (Math.random() - .5) * 200, 14), i * 140);
  toast.textContent = 'SIUUU'; toast.hidden = false;
  reduce ? setTimeout(() => toast.hidden = true, 1600)
    : gsap.fromTo(toast, { scale: .4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .5, ease: 'back.out(3)', onComplete: () => gsap.to(toast, { autoAlpha: 0, delay: 1.1, onComplete: () => toast.hidden = true }) });
});

/* ---------- Passport map ---------- */
async function passport() {
  const box = $('[data-map]');
  const chips = $$('.chipgroup button');
  const live = $('[data-map-live]');
  const INFO = new Map(chips.map(b => [b.dataset.id, { cc: b.dataset.cc, name: b.textContent.trim(), tag: b.dataset.tag, btn: b }]));
  chips.forEach(b => b.insertAdjacentHTML('afterbegin', `<img src="${flag(b.dataset.cc)}" alt="" width="22" height="16" loading="lazy">`));
  try {
    const res = await fetch('assets/map.svg');
    if (!res.ok) throw new Error(res.status);
    box.innerHTML = await res.text();
  } catch { return; } // the flag chips below still list every country
  const svg = $('svg', box);
  const tip = Object.assign(document.createElement('div'), { className: 'm-tip', hidden: true });
  tip.setAttribute('aria-hidden', 'true');
  box.append(tip);
  const plane = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  plane.setAttribute('d', 'M-8 -5 L9 0 L-8 5 L-5 0 Z'); plane.setAttribute('class', 'm-plane');
  svg.append(plane); gsap.set(plane, { autoAlpha: 0 });

  let current = null;
  const hot = (id, on) => { $(`.m-countries [data-id="${id}"]`, svg)?.classList.toggle('is-hot', on); INFO.get(id)?.btn.classList.toggle('is-hot', on); };
  function fly(id) {
    const arc = $(`.m-arc[data-to="${id}"]`, svg);
    if (reduce || !fine || !arc) return;
    gsap.killTweensOf(plane);
    gsap.set(plane, { autoAlpha: 1 });
    gsap.to(plane, { duration: 1.3, ease: 'power2.inOut', motionPath: { path: arc, align: arc, alignOrigin: [.5, .5], autoRotate: true },
      onComplete: () => gsap.to(plane, { autoAlpha: 0, delay: .5 }) });
  }
  function show(id, name, x, y, dock) {
    if (current !== id) {
      if (current) hot(current, false);
      current = id; hot(id, true); fly(id);
      const i = INFO.get(id);
      tip.classList.toggle('is-work', !!i && i.tag.startsWith('Worked'));
      tip.innerHTML = i ? `<img src="${flag(i.cc)}" alt="" width="32" height="24"><span><b>${i.name}</b><small>${i.tag}</small></span>`
        : `<span><b>${name}</b><small>Not yet</small></span>`;
    }
    tip.hidden = false;
    tip.classList.toggle('is-dock', dock);
    if (!dock) gsap.set(tip, { x: Math.max(4, Math.min(x + 14, box.clientWidth - tip.offsetWidth - 4)), y: Math.max(4, y - tip.offsetHeight - 14) });
  }
  function hide() { if (current) hot(current, false); current = null; tip.hidden = true; }
  const fromPointer = e => {
    const el = e.target.closest('[data-id]');
    if (!el) return hide();
    const r = box.getBoundingClientRect();
    show(el.dataset.id, el.dataset.name, e.clientX - r.left, e.clientY - r.top, e.pointerType !== 'mouse');
  };
  svg.addEventListener('pointermove', fromPointer);
  svg.addEventListener('pointerdown', fromPointer);
  svg.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hide(); });
  document.addEventListener('pointerdown', e => { if (!box.contains(e.target) && !e.target.closest('.chipgroup')) hide(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  chips.forEach(b => {
    const go = () => {
      const id = b.dataset.id, anchor = $(`.m-pin[data-id="${id}"], .m-dot[data-id="${id}"]`, svg);
      const br = box.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
      show(id, null, ar.left - br.left + ar.width / 2, ar.top - br.top, false);
      live.textContent = `${INFO.get(id).name}: ${INFO.get(id).tag}`;
    };
    b.addEventListener('mouseenter', go); b.addEventListener('focus', go); b.addEventListener('click', go);
    b.addEventListener('mouseleave', hide); b.addEventListener('blur', hide);
  });
  $$('.layers button').forEach(b => b.addEventListener('click', () => {
    $$('.layers button').forEach(x => x.setAttribute('aria-pressed', x === b));
    box.dataset.show = b.dataset.layer;
  }));
  if (!reduce) {
    gsap.from($$('.m-arc', svg), { drawSVG: 0, duration: 1.4, stagger: .05, ease: 'power2.out', immediateRender: false, scrollTrigger: once(box, 'top 70%') });
    gsap.from($$('.m-dot, .m-pin', svg), { scale: 0, transformOrigin: '50% 50%', stagger: .03, duration: .5, ease: 'back.out(3)', immediateRender: false, scrollTrigger: once(box, 'top 70%') });
    gsap.from(chips, { scale: 1.5, rotate: () => gsap.utils.random(-6, 6), autoAlpha: 0, stagger: .025, duration: .45, ease: 'back.out(2)', immediateRender: false, scrollTrigger: once('.chips', 'top 90%') });
  }
  ScrollTrigger.refresh();
}

/* ---------- split-flap board (cells resolve on entry; the plain text stays for screen readers) ---------- */
function splitFlap() {
  $$('[data-flap]').forEach(el => {
    const text = el.textContent.trim();
    el.innerHTML = `<span class="sr-only">${text}</span><span aria-hidden="true">${text.split(' ').map(w =>
      `<span class="fw">${[...w].map(c => `<span class="fc">${c}</span>`).join('')}</span>`).join('')}</span>`;
  });
  if (reduce) return;
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%+~';
  ScrollTrigger.create({ ...once('.flap', 'top 80%'), onEnter: () => $$('.fc').forEach((c, i) => {
    const final = c.textContent, tl = gsap.timeline({ delay: i * .01 });
    for (let k = 0; k < 3 + (i % 5); k++) tl.call(() => { c.textContent = glyphs[Math.random() * glyphs.length | 0]; }).fromTo(c, { rotateX: -90 }, { rotateX: 0, duration: .06, ease: 'none' });
    tl.call(() => { c.textContent = final; }).fromTo(c, { rotateX: -90 }, { rotateX: 0, duration: .1, ease: 'power2.out' });
  }) });
}

/* ---------- dot grid behind the high scores (ReactBits Dot Grid, on canvas) ---------- */
function dotGrid() {
  const cv = $('.dotgrid'), host = cv.parentElement, ctx = cv.getContext('2d'), gap = 26;
  let dots = [], W = 0, H = 0, mx = -1e4, my = -1e4, visible = false;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    for (const d of dots) {
      const dx = d.x - mx, dy = d.y - my, dist = Math.hypot(dx, dy) || 1, push = Math.max(0, (130 - dist) / 130);
      d.ox += (dx / dist * push * 20 - d.ox) * .15; d.oy += (dy / dist * push * 20 - d.oy) * .15;
      ctx.fillStyle = push > .05 ? '#FF4B2B' : 'rgba(31,58,95,.22)';
      ctx.beginPath(); ctx.arc(d.x + d.ox, d.y + d.oy, push > .05 ? 2.6 : 1.8, 0, 7); ctx.fill();
    }
  };
  const size = () => {
    W = host.clientWidth; H = host.clientHeight;
    cv.width = W * devicePixelRatio; cv.height = H * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    dots = [];
    for (let y = gap / 2; y < H; y += gap) for (let x = gap / 2; x < W; x += gap) dots.push({ x, y, ox: 0, oy: 0 });
    draw();
  };
  size(); addEventListener('resize', size);
  if (reduce || !fine) return; // static grid on touch and with reduced motion
  host.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
  host.addEventListener('pointerleave', () => { mx = my = -1e4; });
  ScrollTrigger.create({ trigger: host, onToggle: s => { visible = s.isActive; } });
  gsap.ticker.add(() => { if (visible) draw(); });
}

/* ---------- curved motto loop (ReactBits Curved Loop): drifts on its own, drag to scrub ---------- */
function curvedLoop() {
  const tp = $('[data-motto]'), svg = tp.closest('svg');
  if (reduce) return;
  const unitLen = tp.getComputedTextLength() / 6; // the motto is repeated six times
  let off = -unitLen, vel = 0, dragging = false;
  gsap.ticker.add(() => {
    if (!dragging) off -= 1.2 + vel;
    vel *= .94;
    if (off < -2 * unitLen) off += unitLen;
    if (off > -unitLen) off -= unitLen;
    tp.setAttribute('startOffset', off.toFixed(1));
  });
  const scale = () => 1440 / svg.clientWidth;
  Draggable.create(document.createElement('div'), { trigger: '.motto', type: 'x',
    onPress() { dragging = true; }, onDrag() { off += this.deltaX * scale(); }, onRelease() { dragging = false; vel = -this.deltaX * scale() * .4; } });
}

/* ---------- boot ---------- */
async function boot() {
  await document.fonts.ready;
  splitFlap();
  dotGrid();
  curvedLoop();
  passport();
  $$('[data-uae-time]').forEach(el => { el.textContent = uaeClock(); });

  // scroll island: current section, overall progress, live age; doubles as the phone nav
  const island = $('[data-island-nav]'), pill = $('[data-island-toggle]'), panel = $('#island-panel'), now = $('[data-island-now]');
  // refreshPriority -1: measure these after the Work pin has added its scroll length
  ScrollTrigger.create({ trigger: '.hero', start: 'bottom 55%', end: 'max', refreshPriority: -1, onToggle: s => island.classList.toggle('is-on', s.isActive) });
  ScrollTrigger.create({ start: 0, end: 'max', refreshPriority: -1, onUpdate: s => island.style.setProperty('--p', s.progress.toFixed(3)) });
  $$('[data-island]').forEach(sec => ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', refreshPriority: -1, onToggle: s => {
    if (!s.isActive || now.textContent === sec.dataset.island) return;
    reduce ? (now.textContent = sec.dataset.island) : gsap.to(now, { duration: .5, scrambleText: { text: sec.dataset.island, chars: 'upperCase', speed: .7 } });
  } }));
  const setOpen = open => {
    pill.setAttribute('aria-expanded', open); panel.hidden = !open;
    if (open) { reduce || gsap.from(panel, { y: 14, autoAlpha: 0, scale: .96, duration: .3, ease: 'back.out(2)' }); $('a', panel).focus(); }
  };
  pill.addEventListener('click', () => setOpen(panel.hidden));
  panel.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('pointerdown', e => { if (!panel.hidden && !island.contains(e.target)) setOpen(false); });
  island.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) { setOpen(false); pill.focus(); }
    if (e.key !== 'Tab' || panel.hidden) return;
    const f = [pill, ...$$('a', panel)], i = f.indexOf(document.activeElement); // keep focus inside while open
    if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });

  // rotating Arcade phrase (ReactBits Rotating Text); with reduced motion the full sentence stays
  const rot = $('[data-rot]'), phrases = rot.dataset.phrases.split('|');
  if (!reduce) {
    let n = 0;
    rot.textContent = phrases[0];
    setInterval(() => {
      n = (n + 1) % phrases.length;
      gsap.to(rot, { yPercent: -30, autoAlpha: 0, duration: .22, ease: 'power2.in', onComplete: () => {
        rot.textContent = phrases[n];
        const { chars } = SplitText.create(rot, { type: 'words,chars' }); // words first, so lines only break between words
        gsap.set(rot, { yPercent: 0, autoAlpha: 1 });
        gsap.from(chars, { yPercent: 80, autoAlpha: 0, stagger: .015, duration: .35, ease: 'back.out(2)' });
      } });
    }, 2800);
  }

  $$('.tix').forEach(t => t.addEventListener('pointermove', e => { // spotlight follows the pointer
    const r = t.getBoundingClientRect(); t.style.setProperty('--mx', `${e.clientX - r.left}px`); t.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    const route = $('[data-route]'), track = $('[data-track]');
    route.classList.add('is-pinned');
    const dist = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
    const tween = gsap.to(track, { x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.track-clip', start: 'center center', end: () => `+=${dist()}`, pin: true, scrub: 1, invalidateOnRefresh: true } });
    gsap.from('[data-lanyard]', { rotate: 9, duration: 1.8, ease: 'swing', scrollTrigger: { trigger: '[data-lanyard]', containerAnimation: tween, start: 'left 85%', once: true } });
    return () => route.classList.remove('is-pinned');
  });
  mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.from('[data-lanyard]', { rotate: 7, duration: 1.8, ease: 'swing', scrollTrigger: once('[data-lanyard]', 'top 85%') });
  });

  // bounce cards fan out when they come into view; hover lifts one
  mm.add('(min-width: 821px)', () => {
    const host = $('[data-bounce]'), cards = $$('.bc', host);
    const fan = [[-150, -12], [-50, -4], [50, 4], [150, 12]];
    cards.forEach((c, i) => gsap.set(c, { x: fan[i][0], rotate: fan[i][1] }));
    const spread = () => {
      const sp = Math.min(300, (host.clientWidth - cards[0].offsetWidth) / 3);
      cards.forEach((c, i) => gsap.to(c, { x: (i - 1.5) * sp, rotate: (i - 1.5) * 1.6, duration: reduce ? 0 : .9, ease: 'elastic.out(1, .6)', overwrite: 'auto' }));
    };
    ScrollTrigger.create({ ...once(host, 'top 75%'), onEnter: spread });
    if (!reduce) cards.forEach(c => {
      c.addEventListener('mouseenter', () => gsap.to(c, { y: -14, scale: 1.04, zIndex: 5, duration: .3 }));
      c.addEventListener('mouseleave', () => gsap.to(c, { y: 0, scale: 1, zIndex: 1, duration: .4 }));
    });
  });

  if (!reduce) motion(mm);
  vantaGlobe();
  ScrollTrigger.refresh();
}

function motion(mm) {
  // headings split into lines; text stays visible until its trigger fires
  $$('[data-split]').forEach(el => {
    const { lines } = SplitText.create(el, { type: 'lines', mask: 'lines' });
    gsap.from(lines, { yPercent: 110, duration: 1, stagger: .09, ease: 'expo.out', immediateRender: false, scrollTrigger: once(el, 'top 90%') });
  });
  $$('[data-reveal]').forEach(el => gsap.from(el, { y: 28, autoAlpha: 0, duration: .8, ease: 'power3.out', immediateRender: false, scrollTrigger: once(el, 'top 92%') }));

  // hero: the name squeezes into shape, the halves close, the stub prints
  const { chars } = SplitText.create('[data-name]', { type: 'words,chars' });
  gsap.timeline()
    .from(chars, { yPercent: 60, autoAlpha: 0, stagger: .025, duration: .7, ease: 'back.out(1.6)' })
    .fromTo('[data-name]', { fontVariationSettings: "'wdth' 100" }, { fontVariationSettings: "'wdth' 78", duration: 1.1, ease: 'snap' }, 0)
    .from('.tk-ledger', { xPercent: -12, autoAlpha: 0, duration: .9, ease: 'expo.out' }, .2)
    .from('.tk-arcade', { xPercent: 12, autoAlpha: 0, duration: .9, ease: 'expo.out' }, .2)
    .from('.stub', { clipPath: 'inset(0 0 100% 0)', duration: .7, ease: 'power3.out' }, .75)
    .from('.xp i', { scaleX: 0, transformOrigin: '0 50%', duration: 1.2, ease: 'power3.out' }, 1);
  const peel = $('[data-peel]');
  Draggable.create(peel, { bounds: '.tk-arcade', inertia: true,
    onPress: () => gsap.to(peel, { scale: 1.08, rotate: -3, duration: .2 }), onRelease: () => gsap.to(peel, { scale: 1, rotate: 4, duration: .4, ease: 'back.out(3)' }) });

  // origin: the 12 lands, the ×2 sticker drops in, raffle tickets print
  gsap.from('.big12', { scale: .6, autoAlpha: 0, duration: 1, ease: 'back.out(1.6)', immediateRender: false, scrollTrigger: once('.big12', 'top 80%') });
  gsap.from('[data-x2]', { y: -160, rotate: -30, duration: 1.3, ease: 'drop', immediateRender: false, scrollTrigger: once('.big12', 'top 75%') });
  gsap.from('[data-raffle]', { clipPath: 'inset(0 100% 0 0)', duration: .8, stagger: .3, ease: 'power3.out', immediateRender: false, scrollTrigger: once('.raffles', 'top 90%') });

  // high scores resolve row by row
  $$('[data-scramble]').forEach((td, i) => gsap.to(td, { duration: 1, delay: i * .12, scrambleText: { text: td.textContent, chars: 'XO0123456789', speed: .5 }, scrollTrigger: once('.board', 'top 80%') }));

  // plot twist: wins tick in, the stamp slams, the card shakes, the room flashes, the continue counter runs
  gsap.timeline({ scrollTrigger: once('[data-ballot]', 'top 65%') })
    .from('[data-ballot] li', { x: -20, autoAlpha: 0, stagger: .15, duration: .4, immediateRender: false })
    .from('[data-stamp]', { scale: 3, autoAlpha: 0, duration: .45, ease: 'back.out(1.4)' }, '+=.25')
    .to('[data-ballot]', { x: 12, duration: .6, ease: 'shake' }, '<.3')
    .to('.twist', { backgroundColor: '#FF4B2B', duration: .12, yoyo: true, repeat: 1 }, '<')
    .to({ n: 9 }, { n: 0, duration: 4.5, ease: 'none', onUpdate() { $('[data-count9]').textContent = Math.ceil(this.targets()[0].n); } }, '+=.3')
    .to('[data-continue] .btn', { scale: 1.06, duration: .25, yoyo: true, repeat: 3 });

  // career rail: the axis draws, bars grow in date order
  gsap.from('[data-axis]', { drawSVG: 0, duration: 1.2, ease: 'power2.out', immediateRender: false, scrollTrigger: once('.rail', 'top 85%') });
  gsap.from('.bar', { scaleX: 0, duration: .7, stagger: .12, ease: 'power3.out', immediateRender: false, scrollTrigger: once('.rail', 'top 85%') });

  // ventures deal in; Trovea's flow draws; tilt on fine pointers
  ScrollTrigger.batch('.vt', { once: true, start: 'top 85%', onEnter: b => gsap.from(b, { y: 70, rotate: i => (i - 1) * 4, autoAlpha: 0, stagger: .15, duration: .9, ease: 'back.out(1.3)' }) });
  gsap.from('[data-flowline]', { drawSVG: 0, duration: 1.2, ease: 'power2.inOut', immediateRender: false, scrollTrigger: once('.flow', 'top 90%') });
  if (fine) $$('[data-tilt]').forEach(card => {
    const rx = gsap.quickTo(card, 'rotationX', { duration: .4 }), ry = gsap.quickTo(card, 'rotationY', { duration: .4 });
    card.addEventListener('pointermove', e => { const r = card.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 10); rx(-((e.clientY - r.top) / r.height - .5) * 10); });
    card.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });

  // scroll velocity rows: constant drift, faster while you scroll
  const rows = $$('[data-velo]').map(row => {
    const w = row.children[0].offsetWidth, dir = +row.dataset.velo;
    return gsap.fromTo(row, { x: dir > 0 ? 0 : -w }, { x: dir > 0 ? -w : 0, duration: w / 55, ease: 'none', repeat: -1 });
  });
  let boost = 0;
  ScrollTrigger.create({ trigger: '.beyond', start: 'top bottom', end: 'bottom top', onUpdate: s => { boost = Math.min(Math.abs(s.getVelocity()) / 250, 6); } });
  gsap.ticker.add(() => { boost *= .94; rows.forEach(t => t.timeScale(1 + boost)); });

  // magnet handles
  if (fine) $$('[data-magnet]').forEach(el => {
    const x = gsap.quickTo(el, 'x', { duration: .4 }), y = gsap.quickTo(el, 'y', { duration: .4 });
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * .35); y((e.clientY - r.top - r.height / 2) * .35); });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}

/* ---------- Vanta globe behind the contact card: wide screens with a mouse only, loaded on approach ---------- */
function vantaGlobe() {
  const el = $('[data-globe]');
  const ok = matchMedia('(min-width: 1024px)').matches && fine && !reduce && !navigator.connection?.saveData && (navigator.hardwareConcurrency || 4) >= 4;
  if (!ok) return; // the section's navy background is the fallback
  const load = src => new Promise((res, rej) => document.head.append(Object.assign(document.createElement('script'), { src, onload: res, onerror: rej })));
  let fx = null, loading = null;
  new IntersectionObserver(async ([entry]) => {
    if (entry.isIntersecting && !fx) {
      loading ||= load('https://cdn.jsdelivr.net/npm/three@0.134.0/build/three.min.js').then(() => load('https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.globe.min.js'));
      try { await loading; } catch { return; }
      if (!fx) fx = VANTA.GLOBE({ el, THREE, mouseControls: true, touchControls: false, gyroControls: false, scale: 1, size: 1.1,
        color: 0xff4b2b, color2: 0x4fd1b5, backgroundColor: 0x1f3a5f });
    } else if (!entry.isIntersecting && fx) { fx.destroy(); fx = null; } // free the GPU once the section is off screen
  }, { rootMargin: '600px 0px' }).observe(el);
}

boot();
