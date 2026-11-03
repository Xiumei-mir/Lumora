import { api, saveSession, getUser } from '/portal-lib.js';
import { getToken, getUser, saveSession, logout, api } from '/portal-lib.js';

const f = document.getElementById('loginForm');
const st = document.getElementById('loginStatus');
f.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const j = await api('/auth/login', { method: 'POST', body: { email: f.email.value, password: f.password.value } });
    saveSession(j.token, j.user);
    st.textContent = '';
    const dest = j.user.role === 'admin' || j.user.role === 'statistician' ? '/admin.html' : '/portal.html';
    window.location.href = dest;
  } catch (err) {
    st.textContent = err.message === 'email_atau_salah_password' ? 'Email atau kata sandi salah.' : 'Gagal masuk: ' + err.message;
    st.className = 'form-status err';
  }
});
