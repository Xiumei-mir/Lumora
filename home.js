// Nav + mobile menu
const toggle = document.getElementById('navToggle');
const menu = document.getElementById('siteMenu');
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  });
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Hero carousel
const slides = [...document.querySelectorAll('.hero-slide')];
const dots = [...document.querySelectorAll('.hero-dot')];
const counter = document.getElementById('heroCounter');
let cur = 0, timer;
if (slides.length) {
  function go(n) {
    cur = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('hero-slide--active', i === cur));
    dots.forEach((d, i) => d.classList.toggle('hero-dot--active', i === cur));
    if (counter) counter.textContent = String(cur + 1).padStart(2, '0') + ' / 0' + slides.length;
    restart();
  }
  function restart() {
    clearInterval(timer);
    if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      timer = setInterval(() => go(cur + 1), 7000);
    }
  }
  const prev = document.getElementById('heroPrev');
  const next = document.getElementById('heroNext');
  if (prev) prev.addEventListener('click', () => go(cur - 1));
  if (next) next.addEventListener('click', () => go(cur + 1));
  dots.forEach((d) => d.addEventListener('click', () => go(+d.dataset.goto)));
  restart();
}

// Logo philosophy
const descs = [
  '<strong>Huruf L</strong> — fondasi kokoh: setiap analisis berdiri di atas metode statistika yang valid, bukan opini.',
  '<strong>Grafik Batang</strong> — data kuantitatif: angka penjualan, stok, dan churn dibedah apa adanya.',
  '<strong>Panah ke atas</strong> — peningkatan kualitas keputusan: dari feeling menjadi presisi terukur.',
  '<strong>Bintang lavender ✦</strong> — insight baru: temuan tak terduga yang menerangi jalan bisnis Anda.'
];
const parts = [...document.querySelectorAll('.logo-part')];
const logoDesc = document.getElementById('logoDesc');
if (parts.length && logoDesc) {
  parts.forEach((p) => {
    const act = () => {
      parts.forEach((x) => x.classList.remove('logo-part--active'));
      p.classList.add('logo-part--active');
      logoDesc.innerHTML = descs[+p.dataset.logo];
    };
    p.addEventListener('click', act);
    p.addEventListener('mouseenter', act);
  });
}

// Before/after tabs
const tabs = [...document.querySelectorAll('.tab-btn')];
const pb = document.getElementById('panelBefore');
const pa = document.getElementById('panelAfter');
if (tabs.length && pb && pa) {
  tabs.forEach((t) =>
    t.addEventListener('click', () => {
      const after = t.dataset.tab === 'after';
      tabs.forEach((x) => x.classList.remove('tab-btn--active'));
      t.classList.add('tab-btn--active');
      pb.hidden = after;
      pa.hidden = !after;
    })
  );
}

// Service prefill
document.querySelectorAll('.service-link').forEach((b) =>
  b.addEventListener('click', () => {
    const sel = document.getElementById('fLayanan');
    if (sel) {
      sel.value = b.dataset.service;
      sel.classList.add('invalid');
      setTimeout(() => sel.classList.remove('invalid'), 1600);
    }
    document.getElementById('kontak').scrollIntoView({ behavior: 'smooth' });
  })
);

// Form submit -> real API
const form = document.getElementById('leadForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ok = document.getElementById('formOk');
    const err = document.getElementById('formErr');
    const btn = document.getElementById('submitBtn');
    const email = document.getElementById('fEmail');
    const emailBad = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim());
    const emailErr = form.querySelector('[data-err="email"]');
    if (emailErr) emailErr.hidden = !emailBad;
    const required = [...form.querySelectorAll('[required]')];
    let valid = true;
    required.forEach((f) => {
      const bad =
        !f.value.trim() ||
        (f.id === 'fMasalah' && f.value.trim().length < 20) ||
        (f === email && emailBad);
      f.classList.toggle('invalid', bad);
      if (bad) valid = false;
    });
    ok.hidden = true;
    err.hidden = true;
    if (!valid) {
      err.textContent =
        'Mohon lengkapi field bertanda * dan periksa format email. Data Anda tidak hilang — perbaiki lalu kirim ulang.';
      err.hidden = false;
      return;
    }
    btn.disabled = true;
    const oldHTML = btn.innerHTML;
    btn.innerHTML = 'Mengirim…';
    const payload = {
      name: document.getElementById('fNama').value.trim(),
      email: email.value.trim(),
      segment: document.getElementById('fInstansi').value.trim(),
      service: document.getElementById('fLayanan').value,
      message: document.getElementById('fMasalah').value.trim(),
      phone: ''
    };
    try {
      const r = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.ok) {
        ok.hidden = false;
        form.reset();
        ok.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        err.textContent = data.error || 'Terjadi gangguan. Data Anda tidak hilang — silakan coba lagi atau hubungi halo@lumora.id.';
        err.hidden = false;
      }
    } catch (_) {
      err.textContent = 'Koneksi bermasalah. Periksa internet Anda lalu kirim ulang — data tidak hilang.';
      err.hidden = false;
    }
    btn.disabled = false;
    btn.innerHTML = oldHTML;
  });
}

// Scroll-reveal
if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const revealEls = document.querySelectorAll('.reveal, .viz-card, .service-card, .case, .value-cell, .step');
  revealEls.forEach((el) => el.classList.remove('in-view'));
  document.querySelectorAll('.hero-visual .viz-card').forEach((el, i) => {
    setTimeout(() => el.classList.add('in-view'), 200 + i * 150);
  });
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in-view');
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );
  revealEls.forEach((el) => io.observe(el));
}
