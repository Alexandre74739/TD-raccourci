async function request(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error("L’API est injoignable. Vérifiez que Flask est démarré.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Erreur API (${response.status}).`);
  if (data === null) throw new Error("Réponse API invalide. Vérifiez le proxy Vite.");
  return data;
}

export function api(path = '', options = {}) {
  return request(`/api/shortcuts${path}`, options);
}

export function categories() {
  return request('/api/categories');
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}
