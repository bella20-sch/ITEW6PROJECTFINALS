/**
 * Dev + no VITE_API_BASE: use '' (same origin) so Vite proxies /api → localhost:5000.
 * Set VITE_API_BASE=http://localhost:5000 only if you want to bypass the proxy.
 * Production build: defaults to http://localhost:5000 unless VITE_API_BASE is set.
 */
export function getApiBase() {
  const raw = import.meta.env.VITE_API_BASE
  if (raw !== undefined && String(raw).trim() !== '') {
    return String(raw).replace(/\/+$/, '')
  }
  if (import.meta.env.DEV) return ''
  return 'http://localhost:5000'
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

