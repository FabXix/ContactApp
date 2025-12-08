// frontend/js/perfil.js
import { requireSession, getToken, getUserId, saveSession, logout } from "./session.js";
import { showNotification } from "./notifications.js";

const API_URL = "/users";

const session = requireSession();
if (!session) {
  window.location.replace("/login.html");
}

const token = getToken();           
const loggedUserId = getUserId();   


const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session") || loggedUserId;


document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  loadMyProjects();
  loadCollaborationProjects();

  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await updateProfile();
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
});


async function loadProfile() {
  try {
    const res = await fetch(`${API_URL}/${sessionId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Error HTTP ${res.status}`);
    }

    const data = await res.json();

    const username = data.username || "—";
    const email = data.email || "—";
    const rol = data.rol || "—";
    const description = data.description || "";

    const usernameEl = document.getElementById("username");
    const emailEl = document.getElementById("email");
    const rolEl = document.getElementById("rol");
    const descriptionEl = document.getElementById("description");

    if (usernameEl) usernameEl.textContent = username;
    if (emailEl) emailEl.textContent = email;
    if (rolEl) rolEl.textContent = rol;
    if (descriptionEl) descriptionEl.textContent = description || "";


    const editToggle = document.getElementById("editToggle");
    const editSection = document.getElementById("editSection");
    const editUsername = document.getElementById("editUsername");
    const editDescription = document.getElementById("editDescription");

    if (sessionId === loggedUserId) {
      if (editUsername) editUsername.value = username;
      if (editDescription) editDescription.value = description || "";

      if (editToggle && editSection) {
        editToggle.style.display = "inline-block";
        editSection.style.display = "none";
        
        const newToggle = editToggle.cloneNode(true);
        editToggle.parentNode.replaceChild(newToggle, editToggle);
        
        newToggle.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const currentSection = document.getElementById("editSection");
          if (currentSection) {
            const isVisible = currentSection.style.display === "block";
            currentSection.style.display = isVisible ? "none" : "block";
          }
        });
      }

    } else {
      if (editToggle) editToggle.style.display = "none";
      if (editSection) editSection.style.display = "none";
    }

  } catch (err) {
    showNotification(err.message || "Error al cargar el perfil", "error");
  }
}


async function updateProfile() {
  const newUsername = document.getElementById("editUsername")?.value.trim() || "";
  const newDescription =
    document.getElementById("editDescription")?.value.trim() || "";

  if (!newUsername) {
    showNotification("⚠️ El nombre no puede quedar vacío.", "error");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/${sessionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        username: newUsername,
        description: newDescription
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error HTTP ${res.status}`);
    }

    const data = await res.json();


    const updatedUsername = data.user?.username || newUsername;
    const updatedDescription = data.user?.description || newDescription || "";

    document.getElementById("username").textContent = updatedUsername;
    document.getElementById("description").textContent = updatedDescription || "";


    if (sessionId === loggedUserId) {
      const current = JSON.parse(localStorage.getItem("userToken") || "{}");
      current.username = newUsername; 
      saveSession(current);

      const navbarUser = document.getElementById("navbarUsername");
      if (navbarUser) navbarUser.textContent = newUsername;
    }


    const editSection = document.getElementById("editSection");
    if (editSection) editSection.style.display = "none";

    showNotification("✔ Perfil actualizado correctamente", "success");

  } catch (err) {
    showNotification(err.message || "Error al actualizar perfil", "error");
  }
}


async function loadMyProjects() {
  const projectList = document.getElementById("projectList");
  if (!projectList) return;

  try {
    const res = await fetch(`/projects?owner=${sessionId}&limit=100`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

    const data = await res.json();
    const projects = data.results || [];

    if (projects.length === 0) {
      projectList.innerHTML = '<p class="no-projects">No tienes proyectos aún</p>';
      return;
    }

    projectList.innerHTML = projects.map(p => {
      const categories = (p.categorias && p.categorias.length > 0) 
        ? p.categorias.map(cat => `<span style="background:#e0f2fe; color:#0369a1; padding:0.25rem 0.5rem; border-radius:0.5rem; font-size:0.85rem; margin-right:0.3rem; display:inline-block;">${cat}</span>`).join("")
        : "";
      
      const statusText = p.status === "Closed" ? "Cerrado" : 
                        p.status === "Work in progress" ? "En progreso" : 
                        "Buscando miembros";
      const statusColor = p.status === "Closed" ? "#dc2626" : 
                         p.status === "Work in progress" ? "#f59e0b" : 
                         "#10b981";
      const statusBadge = p.status ? `<span style="background:${statusColor}; color:white; padding:0.25rem 0.6rem; border-radius:0.5rem; font-size:0.85rem; font-weight:500; display:inline-block; margin-top:0.5rem;">${statusText}</span>` : "";
      
      return `
      <div class="project-item">
        <h5>${p.name || "Sin nombre"}</h5>
        <p>${p.description || "Sin descripción"}</p>
        ${categories ? `<div style="margin-top:0.5rem;">${categories}</div>` : ""}
        ${statusBadge}
      </div>
    `;
    }).join("");

  } catch (err) {
    projectList.innerHTML = '<p class="no-projects">Error al cargar proyectos</p>';
  }
}

async function loadCollaborationProjects() {
  const collabList = document.getElementById("collabList");
  if (!collabList) return;

  try {
    const res = await fetch(`/projects?limit=100`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

    const data = await res.json();
    const allProjects = data.results || [];
    
    const collabProjects = allProjects.filter(p => 
      p.colaboradores && 
      p.colaboradores.includes(sessionId) && 
      p.ownerId !== sessionId
    );

    if (collabProjects.length === 0) {
      collabList.innerHTML = '<p class="no-projects">No colaboras en ningún proyecto</p>';
      return;
    }

    collabList.innerHTML = collabProjects.map(p => {
      const categories = (p.categorias && p.categorias.length > 0) 
        ? p.categorias.map(cat => `<span style="background:#e0f2fe; color:#0369a1; padding:0.25rem 0.5rem; border-radius:0.5rem; font-size:0.85rem; margin-right:0.3rem; display:inline-block;">${cat}</span>`).join("")
        : "";
      
      const statusText = p.status === "Closed" ? "Cerrado" : 
                        p.status === "Work in progress" ? "En progreso" : 
                        "Buscando miembros";
      const statusColor = p.status === "Closed" ? "#dc2626" : 
                         p.status === "Work in progress" ? "#f59e0b" : 
                         "#10b981";
      const statusBadge = p.status ? `<span style="background:${statusColor}; color:white; padding:0.25rem 0.6rem; border-radius:0.5rem; font-size:0.85rem; font-weight:500; display:inline-block; margin-top:0.5rem;">${statusText}</span>` : "";
      
      return `
      <div class="project-item">
        <h5>${p.name || "Sin nombre"}</h5>
        <p>${p.description || "Sin descripción"}</p>
        ${categories ? `<div style="margin-top:0.5rem;">${categories}</div>` : ""}
        ${statusBadge}
        <p style="font-size:0.85rem; color:#94a3b8; margin-top:0.3rem;">
          <i class="fa-solid fa-user me-1"></i>Propietario: ${p.ownerName || "Desconocido"}
        </p>
      </div>
    `;
    }).join("");

  } catch (err) {
    collabList.innerHTML = '<p class="no-projects">Error al cargar colaboraciones</p>';
  }
}
