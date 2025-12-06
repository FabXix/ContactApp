// frontend/js/main.js

const API_URL = "http://localhost:3000/users";



function showNotification(message, type = "success") {
  const id = "notification-container";
  let container = document.getElementById(id);

  if (!container) {
    container = document.createElement("div");
    container.id = id;
    Object.assign(container.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 9999
    });
    document.body.appendChild(container);
  }

  const notif = document.createElement("div");
  notif.textContent = message;
  Object.assign(notif.style, {
    background: type === "success" ? "#22c55e" :
                type === "error" ? "#ef4444" : "#3b82f6",
    color: "#fff",
    padding: "12px 20px",
    marginTop: "10px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    fontWeight: "500",
    opacity: "0",
    transform: "translateY(-20px)",
    transition: "all 0.3s ease"
  });

  container.appendChild(notif);
  requestAnimationFrame(() => {
    notif.style.opacity = "1";
    notif.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    notif.style.opacity = "0";
    notif.style.transform = "translateY(-20px)";
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

function saveSession({ token, id, username, rol }) {
  localStorage.setItem(
    "userToken",
    JSON.stringify({ token, id, username, rol })
  );
}

function loadSession() {
  const data = localStorage.getItem("userToken");
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function logout() {
  localStorage.removeItem("userToken");
  window.location.href = "/login.html";
}


const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;

    const body = {
      username: form.username.value.trim(),
      password: form.password.value,
      email: form.email.value.trim(),
      description: form.description.value.trim() || "",
      rol: form.rol.value || "Estudiante"
    };

    if (!body.username || !body.password || !body.email) {
      showNotification("Completa los campos obligatorios", "error");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      showNotification(data.message, res.status === 201 ? "success" : "error");

      if (res.status === 201) form.reset();
    } catch (err) {
      console.error(err);
      showNotification("Error en el registro", "error");
    }
  });
}


const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;

    const body = {
      email: form.email.value.trim(),
      password: form.password.value
    };

    if (!body.email || !body.password) {
      showNotification("Completa todos los campos", "error");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        showNotification(data.message || "Credenciales incorrectas", "error");
        return;
      }

      const jwt = data.token;
      if (!jwt) {
        showNotification("No se recibió token del servidor", "error");
        return;
      }

      const payload = JSON.parse(atob(jwt.split(".")[1]));

      saveSession({
        token: jwt,
        id: payload.id,
        rol: payload.rol,
        username: payload.username
      });

      showNotification(`Bienvenido ${payload.username}`, "success");

      setTimeout(() => {
        if (payload.rol === "Admin") {
          window.location.href = `/admin.html`;
        } else {
          window.location.href = `/mainpage.html?session=${payload.id}`;
        }
      }, 600);

    } catch (err) {
      console.error(err);
      showNotification("Error al iniciar sesión", "error");
    }
  });
}



