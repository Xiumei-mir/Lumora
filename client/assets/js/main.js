// Mobile menu
const navMenuBtn = document.querySelector('.nav-menu-btn');
const navLinks = document.querySelector('.nav-links');

navMenuBtn.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      if (navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
      }
    }
  });
});

// Form demo submit
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Terima kasih! Kami akan menghubungi Anda dalam 24 jam melalui email yang terdaftar.');
    contactForm.reset();
  });
}

// Counter animation on scroll
const counters = document.querySelectorAll('.stat-number[data-target]');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.getAttribute('data-target'), 10);
      const suffix = el.textContent.trim().endsWith('%') ? '%' : '+';
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 50));
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          el.textContent = target + suffix;
          clearInterval(timer);
        } else {
          el.textContent = current + suffix;
        }
      }, 20);
      observer.unobserve(el);
    }
  });
}, { threshold: 0.5 });

counters.forEach(counter => observer.observe(counter));

// Form service select pre-fill
const layananSelect = document.getElementById('layanan-select');
if (layananSelect) {
  const serviceLinks = document.querySelectorAll('.service-btn[data-service]');
  serviceLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const serviceMap = {
        'kuantitatif': 'Statistika Kuantitatif (regresi, SEM, uji hipotesis)',
        'business': 'Business Analytics (churn, segmentasi, forecast)',
        'visualisasi': 'Dashboard & Visualisasi',
        'pelatihan': 'Pelatihan & Pendampingan Tim'
      };
      const service = serviceMap[link.dataset.service];
      layananSelect.value = service;
    });
  });
}