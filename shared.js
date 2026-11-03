// Nav + form behavior, shared di semua halaman
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

// Scroll-reveal (fade + lift) + counter — hormati prefers-reduced-motion
if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const revealEls = document.querySelectorAll('.card-grid .card, .price-grid .price-card, .values-grid .value-card, .case-grid .case-card, .service-detail, .section-head, .viz-card, .reveal');
  revealEls.forEach((el) => el.classList.remove('in-view'));

  // Hero visual: trigger saat di-mount biar animasi chart jalan
  document.querySelectorAll('.hero-visual .viz-card').forEach((el, i) => {
    setTimeout(() => el.classList.add('in-view'), 200 + i * 150);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('in-view');
        // counter animasi
        const counter = en.target.querySelector('[data-count]');
        if (counter) animateCounter(counter);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  revealEls.forEach((el) => io.observe(el));

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    const dur = 1200;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
} else {
  // reduced-motion: langsung tampil, counter penuh
  document.querySelectorAll('[data-count]').forEach((el) => {
    el.textContent = el.dataset.count;
  });
}

const form = document.getElementById('consultForm');
if (form) {
  const status = document.getElementById('formStatus');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = '';
    const fields = form.querySelectorAll('[required]');
    let valid = true;
    fields.forEach((f) => {
      f.classList.remove('invalid');
      if (!f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value))) {
        f.classList.add('invalid');
        valid = false;
      }
    });
    if (!valid) {
      status.classList.add('err');
      status.textContent = 'Mohon lengkapi semua kolom yang wajib diisi.';
      return;
    }
    // Ponytail: kirim lead ke API; upgrade: validasi server + anti-spam (rate limit/CAPTCHA)
    const leadPayload = {
      name: form.nama.value,
      email: form.email.value,
      phone: form.whatsapp.value,
      segment: form.segmen.value,
      service: form.layanan.value,
      message: form.deskripsi.value
    };
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(leadPayload)
    }).catch((e) => console.warn('Lead tidak terkirim ke server (mungkin dev statis).', e));
    // ponytail: form static — belum ada backend. Upgrade: POST ke endpoint API / email service
    const wa = form.whatsapp.value.replace(/\D/g, '');
    const msg = `Halo Lumora! Saya ${form.nama.value} (${form.segmen.value}). Kebutuhan: ${form.layanan.value}. Detail: ${form.deskripsi.value}`;
    window.open(`https://wa.me/628111344438?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    status.classList.add('ok');
    status.textContent = 'Terima kasih! Silakan lanjutkan via WhatsApp untuk konfirmasi.';
    form.reset();
  });
}
