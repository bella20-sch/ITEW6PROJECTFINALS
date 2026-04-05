const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export function getApiBase() {
  return API_BASE.replace(/\/+$/, '')
}

export async function apiFetch(path, { token, method = 'GET', body, headers } = {}) {
  const url = `${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || text || 'Request failed.'
    const err = new Error(msg)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

