const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return sessionStorage.getItem('eims_token');
}

// sessionStorage (not localStorage) so the token clears when the tab closes -
// a small but deliberate security choice for a demo app handling auth tokens.
export function setToken(token) {
  sessionStorage.setItem('eims_token', token);
}

export function clearToken() {
  sessionStorage.removeItem('eims_token');
}

export function getUser() {
  const raw = sessionStorage.getItem('eims_user');
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user) {
  sessionStorage.setItem('eims_user', JSON.stringify(user));
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    clearToken();
    sessionStorage.removeItem('eims_user');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.error || data?.errors?.join(', ') || 'Request failed';
    throw new Error(message);
  }

  return data;
}

export const api = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  getDashboard: () => request('/dashboard'),

  getEmployees: () => request('/employees'),
  createEmployee: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE' }),

  getInventory: () => request('/inventory'),
  createItem: (data) => request('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (id, data) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteItem: (id) => request(`/inventory/${id}`, { method: 'DELETE' }),

  getDepartments: () => request('/departments'),
  getCategories: () => request('/categories'),
};
