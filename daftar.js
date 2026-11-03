import { api, saveSession } from '/portal-lib.js';

const f = document.getElementById('regForm');
const st = document.getElementById('regStatus');
f.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const j = await api('/auth/register', {
      method: 'POST',
      body: {
        name: f.name.value,
        email: f.email.value,
        password: f.password.value,
        phone: f.phone.value,
        segment: f.segment.value,
        role: 'client'
      }
    });
    saveSession(j.token, j.user);
    st.textContent = 'Akun dibuat. Mengalihkan…';
    st.className = 'form-status ok';
    setTimeout(() => (window.location.href = '/portal.html'), 700);
  } catch (err) {
    st.textContent = err.message === 'email_sudah_daftar' ? 'Email sudah terdaftar. Silakan masuk.' : 'Gagal daftar: ' + err.message;
    st.className = 'form-status err';
  }
});
