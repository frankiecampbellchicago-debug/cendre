document.documentElement.classList.add('js');

// Nav: solid on scroll, mobile toggle
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > 40);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  links.classList.toggle('is-open', open);
});
links.addEventListener('click', e => {
  if (e.target.closest('a')) { toggle.setAttribute('aria-expanded', 'false'); links.classList.remove('is-open'); }
});

// Split menu: cursor on the left opens food, on the right opens drinks
const split = document.getElementById('menu');
const sides = split.querySelectorAll('.side');
const tabs = split.querySelectorAll('.split__tabs button');
const touchMode = window.matchMedia('(max-width: 860px), (hover: none)');

function setSide(name) {
  if (split.dataset.active === name) return;
  split.dataset.active = name;
  sides.forEach(s => {
    s.classList.toggle('is-active', s.dataset.side === name);
    s.classList.toggle('is-closed', name !== 'none' && s.dataset.side !== name);
  });
  tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.side === name));
}

split.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || touchMode.matches) return;
  const r = split.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  // small dead zone around the divider so it doesn't flicker
  const current = split.dataset.active;
  const edge = current === 'food' ? 0.7 : current === 'drinks' ? 0.3 : 0.5;
  if (x < edge - 0.04) setSide('food');
  else if (x > edge + 0.04) setSide('drinks');
});
tabs.forEach(t => t.addEventListener('click', () => setSide(t.dataset.side)));
// keyboard users: focusing into a side opens it
sides.forEach(s => s.addEventListener('focusin', () => setSide(s.dataset.side)));

const syncMode = () => { if (touchMode.matches && split.dataset.active === 'none') setSide('food'); };
syncMode();
touchMode.addEventListener('change', syncMode);

// Spaces: hovering a room swaps the background
const spaceImgs = document.querySelectorAll('.spaces__bgs img');
const spaceBtns = document.querySelectorAll('.spaces__list button');
spaceBtns.forEach(b => {
  const go = () => {
    spaceImgs.forEach((img, j) => img.classList.toggle('is-active', j == b.dataset.i));
    spaceBtns.forEach(o => { o.classList.toggle('is-active', o === b); o.setAttribute('aria-pressed', o === b); });
  };
  ['mouseenter', 'focus', 'click'].forEach(ev => b.addEventListener(ev, go));
});

// Reveal on scroll
const io = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal, .reveal-clip').forEach(el => io.observe(el));

// Reservation: multi-step
const form = document.getElementById('booking');
const steps = form.querySelectorAll('.step');
const markers = document.querySelectorAll('.steps li');
let current = 0;

const dateInput = form.elements.date;
dateInput.min = new Date().toISOString().split('T')[0];

function show(i) {
  current = i;
  steps.forEach((s, j) => s.classList.toggle('is-active', j === i));
  markers.forEach((m, j) => { m.classList.toggle('is-current', j === i); m.classList.toggle('is-done', j < i); });
  const focusable = steps[i].querySelector('input, select, textarea, [tabindex]');
  if (focusable) focusable.focus({ preventScroll: true });
}

function validate(step) {
  let ok = true;
  step.querySelectorAll('.err').forEach(e => e.remove());
  step.querySelectorAll('input[required]:not([type="radio"]), select[required]').forEach(f => {
    const valid = f.checkValidity();
    f.setAttribute('aria-invalid', !valid);
    if (!valid) {
      ok = false;
      const msg = document.createElement('span');
      msg.className = 'err';
      msg.id = f.name + '-err';
      msg.textContent = f.validity.valueMissing ? 'Required' : f.type === 'email' ? 'Enter a valid email' : 'Check this field';
      f.setAttribute('aria-describedby', msg.id);
      f.insertAdjacentElement('afterend', msg);
    } else {
      if (f.name === 'email') f.setAttribute('aria-describedby', 'emailHint');
      else f.removeAttribute('aria-describedby');
    }
  });
  if (!ok) step.querySelector('[aria-invalid="true"]').focus();
  return ok;
}

form.addEventListener('click', e => {
  if (e.target.matches('[data-next]') && validate(steps[current])) show(current + 1);
  if (e.target.matches('[data-back]')) show(current - 1);
});

form.addEventListener('submit', e => {
  e.preventDefault();
  if (!validate(steps[current])) return;
  const d = new FormData(form);
  const date = new Date(d.get('date') + 'T00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('summary').textContent =
    `${d.get('name')}, a table for ${d.get('guests')} on ${date} at ${d.get('time')}. Seating: ${d.get('seat')}. Your confirmation will be emailed to ${d.get('email')}.`;
  // TODO: connect to a form inbox (e.g. Formspree) or booking system before launch
  show(3);
});

document.getElementById('year').textContent = new Date().getFullYear();
