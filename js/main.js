// Данные — из Instagram @alexdoors3214 (подписи к постам почти дословно).
const TYPES = [
  { img: 'ash-08', title: 'Классические', text: 'Филёнчатые, эмаль или массив. Скрытые петли и магнитные замки.' },
  { img: 'turnkey-01', title: 'Скрытые', text: 'В плоскости стены, под покраску или обои. Без наличников.' },
  { img: 'loft-02', title: 'Раздвижные LOFT', text: 'Полотно на открытой чёрной направляющей. Экономит место.' },
  { img: 'glass-03', title: 'Стеклянные', text: 'Калёное стекло 8 мм, коробка и наличник из массива ясеня.' },
  { img: 'double-06', title: 'Сдвижные двойные', text: 'Две створки уходят на стену в одну сторону. Выход для узких проёмов.' },
  { img: 'sauna-04', title: 'Для бани', text: 'Стеклянные двери в парную вместе с отделкой бани.' },
];

const CASES = [
  { key: 'ash', n: 10, cover: 1, title: 'Массив ясеня', text: 'Скрытые петли, магнитные замки. Классика жанра.' },
  { key: 'glass', n: 10, cover: 5, title: 'Стекло 8 мм и ясень', text: 'Калёное стекло, коробка и наличник — массив ясеня.' },
  { key: 'wardrobe', n: 10, cover: 3, title: 'Шкаф-гардероб', text: '100% массив ясеня, резные фасады.' },
  { key: 'loft', n: 5, cover: 2, title: 'Раздвижная LOFT', text: 'Чёрное полотно на открытой направляющей.' },
  { key: 'double', n: 8, cover: 6, title: 'Двойная сдвижная', text: 'Сдвигается на стену в одну сторону.' },
  { key: 'alder', n: 10, cover: 2, title: 'Массив ольхи', text: 'Эмаль и патина под золото.' },
  { key: 'turnkey', n: 5, cover: 2, title: 'Квартира под ключ', text: 'Паркет, двери, рейки на стену и зеркало в раме.' },
  { key: 'slide', n: 9, cover: 4, title: 'Раздвижные со стеклом', text: 'Полотна со стеклом сдвигаются вдоль стены.' },
  { key: 'sauna', n: 7, cover: 4, title: 'Баня', text: 'Потолок и декор подгонялись вручную.' },
  { key: 'led', n: 2, cover: 1, title: 'Стена с подсветкой', text: 'Доска на стене и встроенные LED-линии.' },
];

const pad = i => String(i).padStart(2, '0');
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

document.querySelector('[data-reel]').innerHTML = TYPES.map(t => `
  <article class="type">
    <figure><img src="img/w/${t.img}.jpg" alt="${esc(t.title)} двери — работа Алексея" loading="lazy"></figure>
    <h3>${t.title}</h3>
    <p>${t.text}</p>
  </article>`).join('');

document.querySelector('[data-cases]').innerHTML = CASES.map((c, i) => `
  <button class="case rv" data-case="${i}" aria-label="${esc(c.title)}: открыть ${c.n} фото">
    <figure><img src="img/w/${c.key}-${pad(c.cover)}.jpg" alt="" loading="lazy"><span class="n mono">${c.n} фото</span></figure>
    <h3>${c.title}</h3><p>${c.text}</p>
  </button>`).join('');

// лайтбокс
const dlg = document.querySelector('.lbx');
const lbImg = dlg.querySelector('[data-lb-img]');
let cur = null, idx = 0;
const show = () => {
  idx = (idx + cur.n) % cur.n;
  lbImg.src = `img/${cur.key}-${pad(idx + 1)}.jpg`;
  lbImg.alt = `${cur.title}, фото ${idx + 1}`;
  dlg.querySelector('[data-lb-count]').textContent = `${idx + 1} / ${cur.n}`;
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-case]');
  if (!b) return;
  cur = CASES[b.dataset.case]; idx = cur.cover - 1;
  dlg.querySelector('[data-lb-title]').textContent = cur.title;
  show(); dlg.showModal(); window.lenis?.stop();
});
dlg.addEventListener('close', () => window.lenis?.start());
dlg.querySelector('[data-lb-close]').onclick = () => dlg.close();
dlg.querySelector('[data-lb-prev]').onclick = () => { idx--; show(); };
dlg.querySelector('[data-lb-next]').onclick = () => { idx++; show(); };
dlg.addEventListener('click', e => { if (e.target.matches('.lb, figure')) dlg.close(); });
dlg.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') { idx--; show(); }
  if (e.key === 'ArrowRight') { idx++; show(); }
});
let tx = null;
dlg.addEventListener('touchstart', e => (tx = e.touches[0].clientX), { passive: true });
dlg.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx;
  if (Math.abs(dx) > 40) { idx += dx < 0 ? 1 : -1; show(); }
});

// форма: shortcut: нет endpoint, только показывает «Спасибо» — подключить email+Telegram перед запуском
document.querySelector('form').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  if (!f.reportValidity()) return;
  f.classList.add('sent');
});

// появление блоков
const io = new IntersectionObserver(es => es.forEach(x => x.isIntersecting && (x.target.classList.add('in'), io.unobserve(x.target))), { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.rv').forEach(el => io.observe(el));

// движение
const intro = document.querySelector('.intro');
const motionOK = matchMedia('(prefers-reduced-motion: no-preference)').matches;
const hasGL = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } })();
const libs = window.gsap && window.ScrollTrigger && window.Lenis;

if (!motionOK || !hasGL || !libs) {
  document.documentElement.classList.add('no-3d');
} else {
  gsap.registerPlugin(ScrollTrigger);
  window.lenis = new Lenis({ lerp: 0.1, anchors: { offset: -90 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  const mobile = matchMedia('(max-width: 899px), (pointer: coarse)').matches;
  try {
    const { createDoor } = await import('./door.min.js');   // сборка из door.js, см. README
    intro.classList.add('ready');   // до ScrollTrigger: высота интро должна быть уже итоговой
    const door = createDoor(intro.querySelector('canvas'), { frames: ['img/w/wardrobe-03.jpg', 'img/w/glass-03.jpg', 'img/w/loft-02.jpg'], mobile });
    const cap = intro.querySelector('.cap'), hint = intro.querySelector('.hint');
    const k = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
    // 0–0.8 дверь открывается и камера входит в коридор; 0.74–0.86 проявляется фон hero; 0.82–0.95 текст
    const set = p => {
      door.progress = Math.min(1, p / 0.8);
      cap.style.opacity = 1 - k(p, 0, 0.1);
      hint.style.opacity = 1 - k(p, 0, 0.05);
      hint.style.visibility = p > 0.05 ? 'hidden' : '';
      intro.style.setProperty('--hi', k(p, 0.74, 0.86));
      intro.style.setProperty('--ht', k(p, 0.82, 0.95));
      intro.style.setProperty('--hp', p > 0.85 ? 'auto' : 'none');
      door.active = visible && p < 0.87;   // фон hero закрыл сцену — не рендерим
    };
    let visible = true, last = 0;
    ScrollTrigger.create({ trigger: intro, start: 'top top', end: 'bottom bottom', onUpdate: s => set(last = s.progress), onRefresh: s => set(last = s.progress) });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; set(last); }).observe(intro);
    // клик по двери или подсказке — плавно открыть и войти
    const open = () => lenis.scrollTo(intro.offsetTop + (intro.offsetHeight - innerHeight) * 0.92, { duration: 3.6, easing: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) });   // без easing Lenis игнорирует duration
    intro.querySelector('canvas').addEventListener('click', () => last < 0.5 && open());
    hint.addEventListener('click', open);
    if (!mobile) addEventListener('pointermove', e => door.pointer(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1));
  } catch (err) {
    console.error(err);
    intro.classList.remove('ready');
  }

  // лента типов: горизонтально, закреплённая, только на десктопе
  ScrollTrigger.matchMedia({
    '(min-width: 900px)': () => {
      const reel = document.querySelector('[data-reel]');
      const dist = () => reel.scrollWidth - innerWidth;
      gsap.to(reel, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.types', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true },
      });
    },
  });
}
