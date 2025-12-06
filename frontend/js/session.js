// frontend/js/session.js

/** Guarda la sesión en localStorage */
export function saveSession(sessionObj = {}) {

  const normalized = {
    token: sessionObj.token || null,
    username: sessionObj.username || sessionObj.name || null,
    rol: sessionObj.rol || null,

    id: sessionObj.id || sessionObj._id || null
  };

  localStorage.setItem("userToken", JSON.stringify(normalized));
  return normalized;
}

/** Obtiene la sesión ya normalizada */
export function getSession() {
  const raw = localStorage.getItem("userToken");
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);

    if (!session.token || !session.username || !session.id) {
      return null;
    }

    return session;

  } catch (err) {
    return null;
  }
}

/** Obtiene solo el token */
export function getToken() {
  const s = getSession();
  return s?.token || null;
}

/** Obtiene solo el ID */
export function getUserId() {
  const s = getSession();
  return s?.id || null;
}

/** Obliga a tener sesión */
export function requireSession() {
  const session = getSession();
  if (!session) {
    window.location.replace("/index.html");
    return null;
  }
  return session;
}

/** Cierra sesión */
export function logout() {
  try {
    localStorage.removeItem("userToken");
    window.location.replace("/index.html");
  } catch (err) {
    // Fallback si hay algún error
    localStorage.clear();
    window.location.href = "/index.html";
  }
}
