// Utilitas portal klien & dashboard admin
const API = '/api';

export function getToken() { return localStorage.getItem('lumora_token'); }
export function getUser() {
  try { return JSON.parse(localStorage.getItem('lumora_user')) || null; }
  catch { return null; }
}
export function saveSession(token, user) {
  localStorage.setItem('lumora_token', token);
  localStorage.setItem('lumora_user', JSON.stringify(user));
}
export function logout() {
  localStorage.removeItem('lumora_token');
  localStorage.removeItem('lumora_user');
}

// Guard: redirect ke /login.html jika belum login / role salah
export function requireAuth(roles) {
  const user = getUser();
  if (!getToken() || !user) {
    window.location.replace('/login.html');
    return null;
  }
  if (roles && !roles.includes(user.role)) {
    // role tidak cocok → lempar ke portal umum
    window.location.replace('/portal.html');
    return null;
  }
  return user;
}

export async function api(path, { method = 'GET', body, files, token = getToken() } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (files) {
    payload = files; // FormData — jangan set content-type
  } else if (body) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const r = await fetch(API + path, { method, headers, body: payload });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(j.error || 'gagal');
    err.status = r.status;
    err.data = j;
    throw err;
  }
  return j;
}

export function fmtRp(n) {
  if (n == null || isNaN(n)) return '—';
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

export function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s.replace(' ', 'T') + (s.includes('T') ? '' : 'Z'));
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const STATUS_LABEL = {
  menunggu_pembayaran: 'Menunggu Pembayaran',
  menunggu_data: 'Menunggu Data',
  verifikasi_data: 'Verifikasi Data',
  dalam_pengerjaan: 'Dalam Pengerjaan',
  review_internal: 'Review Internal',
  hasil_siap: 'Hasil Siap',
  revisi: 'Revisi',
  selesai: 'Selesai'
};

export function statusBadge(s) {
  return `<span class="status-badge ${s}">${STATUS_LABEL[s] || s}</span>`;
}

// Logout button di sidebar
export function bindLogout() {
  document.querySelectorAll('[data-logout]').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
      window.location.href = '/login.html';
    });
  });
}
