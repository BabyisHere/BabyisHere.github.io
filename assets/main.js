// Shared by all three previews: smooth scroll, reveals, split headlines, count-ups and the travel map.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
gsap.registerPlugin(ScrollTrigger, SplitText);

if (!reduce) {
  const lenis = new Lenis(); // syncTouch is off by default, so phones keep native scroll
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

const once = (trigger, start = 'top 85%') => ({ trigger, start, once: true });

// immediateRender:false keeps text visible at rest; it only hides at the moment its trigger fires.
function reveals() {
  if (reduce) return;
  gsap.utils.toArray('[data-reveal]').forEach(el =>
    gsap.from(el, { y: 28, autoAlpha: 0, duration: .8, ease: 'power3.out', immediateRender: false, scrollTrigger: once(el, 'top 92%') }));
  gsap.utils.toArray('[data-split]').forEach(el => {
    const { lines } = SplitText.create(el, { type: 'lines', mask: 'lines' });
    gsap.from(lines, { yPercent: 110, duration: 1, stagger: .09, ease: 'expo.out', immediateRender: false, scrollTrigger: once(el, 'top 90%') });
  });
  // Final values are already in the HTML, so no-JS and screen-reader users get the real numbers.
  gsap.utils.toArray('[data-count]').forEach(el => {
    const raw = el.dataset.count, dec = (raw.split('.')[1] || '').length, o = { v: 0 };
    const show = () => el.textContent = o.v.toFixed(dec) + (el.dataset.suffix || '');
    gsap.to(o, { v: +raw, duration: 1.6, ease: 'power2.out', onStart: show, onUpdate: show, scrollTrigger: once(el, 'top 92%') });
  });
}

// [ISO numeric id, name, lon, lat] — capital or main city, used for dots so tiny countries still show.
const PLACES = [
  ['250', 'France', 2.35, 48.86], ['756', 'Switzerland', 7.45, 46.95], ['356', 'India', 77.2, 28.6],
  ['144', 'Sri Lanka', 79.86, 6.93], ['048', 'Bahrain', 50.58, 26.23], ['512', 'Oman', 58.4, 23.6],
  ['682', 'Saudi Arabia', 46.7, 24.7], ['634', 'Qatar', 51.53, 25.29], ['688', 'Serbia', 20.46, 44.8],
  ['268', 'Georgia', 44.8, 41.7], ['031', 'Azerbaijan', 49.87, 40.4], ['300', 'Greece', 23.7, 37.98],
  ['360', 'Indonesia', 106.8, -6.2], ['764', 'Thailand', 100.5, 13.75], ['702', 'Singapore', 103.82, 1.35],
  ['458', 'Malaysia', 101.7, 3.14], ['404', 'Kenya', 36.82, -1.29], ['646', 'Rwanda', 30.06, -1.95],
  ['231', 'Ethiopia', 38.75, 9.03], ['716', 'Zimbabwe', 31.05, -17.83], ['834', 'Tanzania', 39.27, -6.8],
  ['840', 'United States', -77, 38.9], ['124', 'Canada', -75.7, 45.4],
];
const WORK = ['834', '404', '646', '231'];
const HOME = ['784', 'United Arab Emirates', 55.27, 25.2];

async function drawMap() {
  const svg = document.querySelector('[data-map]');
  const list = document.querySelector('[data-map-list]');
  if (list) list.innerHTML = PLACES.map(([id, n]) => `<li${WORK.includes(id) ? ' class="is-work"' : ''}>${n}</li>`).join('');
  if (!svg) return;
  try {
    const world = await fetch('assets/countries-110m.json').then(r => r.json()); // world-atlas@2.0.2, shipped with the page
    const land = topojson.feature(world, world.objects.countries).features.filter(f => f.id !== '010'); // no Antarctica
    const W = 1000, H = 500, proj = d3.geoNaturalEarth1().fitSize([W, H], { type: 'FeatureCollection', features: land });
    const path = d3.geoPath(proj), visited = new Set(PLACES.map(p => p[0]));
    const cls = id => WORK.includes(id) ? 'm-work' : id === HOME[0] ? 'm-home' : visited.has(id) ? 'm-visit' : 'm-land';
    const [hx, hy] = proj([HOME[2], HOME[3]]);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML =
      `<defs><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" class="m-visit"/><line x1="0" y1="0" x2="0" y2="5" class="m-hatch"/></pattern></defs>` +
      land.map(f => `<path d="${path(f)}" class="${cls(f.id)}"/>`).join('') +
      PLACES.map(([id, n, x, y]) => { const [cx, cy] = proj([x, y]); return `<circle cx="${cx}" cy="${cy}" r="4" class="m-dot${WORK.includes(id) ? ' is-work' : ''}"><title>${n}</title></circle>`; }).join('') +
      `<g class="m-pin" transform="translate(${hx} ${hy})"><circle r="8"/><text x="13" y="5">Home</text></g>`;
    if (!reduce) gsap.from(svg.querySelectorAll('.m-dot, .m-pin'), { scale: 0, transformOrigin: '50% 50%', stagger: .035, duration: .5, ease: 'back.out(3)', scrollTrigger: once(svg, 'top 75%') });
  } catch { svg.remove(); } // if the map data fails to load, the text list below still shows every country
}

async function boot(extra) {
  await document.fonts.ready;
  reveals();
  if (!reduce && extra) extra();
  await drawMap();
  ScrollTrigger.refresh();
}

boot(() => {
  // the two halves slide together and the perforation closes
  gsap.timeline()
    .from('.tk-ledger', { xPercent: -12, autoAlpha: 0, duration: .9, ease: 'expo.out' })
    .from('.tk-arcade', { xPercent: 12, autoAlpha: 0, duration: .9, ease: 'expo.out' }, '<');
  gsap.from('.big12', { scale: .6, autoAlpha: 0, duration: 1, ease: 'back.out(1.6)', scrollTrigger: once('.big12', 'top 80%') });
  gsap.from('.big12 .sticker', { scale: 0, rotate: -40, duration: .6, delay: .5, ease: 'back.out(3)', scrollTrigger: once('.big12', 'top 80%') });
  // the stamp slams, the section flashes tomato, then settles back to navy
  gsap.timeline({ scrollTrigger: once('.ballot', 'top 65%') })
    .from('.ballot li', { x: -20, autoAlpha: 0, stagger: .15, duration: .4, immediateRender: false })
    .from('.stamp', { scale: 3, autoAlpha: 0, duration: .5, ease: 'elastic.out(1,.5)' }, '+=.2')
    .to('.twist', { backgroundColor: '#FF4B2B', duration: .12, yoyo: true, repeat: 1 }, '<.05');
  gsap.utils.toArray('.bar i:last-child').forEach(b => gsap.from(b, { scaleX: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: once(b, 'top 92%') }));
});
