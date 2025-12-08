import { requireSession, getToken, getUserId, saveSession, logout } from "./session.js";
import { showNotification } from "./notifications.js";

const API_URL = "";
let currentEditingUserId = null;
let currentEditingProjectId = null;

const session = requireSession();
if (!session || session.rol !== "Admin") {
  window.location.replace("/index.html");
}

const token = getToken();
const userId = getUserId();

document.addEventListener("DOMContentLoaded", () => {
  const adminUsernameEl = document.getElementById("adminUsername");
  if (adminUsernameEl) {
    adminUsernameEl.textContent = session.username;
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }

  loadUsers();
  loadProjects();
});

// ============================================
// USER MANAGEMENT
// ============================================

async function loadUsers() {
  try {
    const res = await fetch(`${API_URL}/users`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Error al cargar usuarios");

    const users = await res.json();
    const tbody = document.getElementById("usersTableBody");
    
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay usuarios</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.id.substring(0, 8)}...</td>
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td><span class="badge-role badge-${user.rol.toLowerCase()}">${user.rol}</span></td>
        <td>${user.description || "—"}</td>
        <td>
          <button class="btn btn-sm btn-warning btn-action" onclick="editUser('${user.id}')">
            <i class="fa-solid fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger btn-action" onclick="deleteUser('${user.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    showNotification("Error al cargar usuarios", "error");
  }
}

function openUserModal(userId = null) {
  currentEditingUserId = userId;
  const modalElement = document.getElementById("userModal");
  const title = document.getElementById("userModalTitle");
  const form = document.getElementById("userForm");
  
  form.reset();
  document.getElementById("userId").value = "";
  
  if (userId) {
    title.textContent = "Editar Usuario";
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    loadUserData(userId);
  } else {
    title.textContent = "Nuevo Usuario";
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
}

async function loadUserData(userId) {
  try {
    const res = await fetch(`${API_URL}/users/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Error al cargar usuario");

    const user = await res.json();
    document.getElementById("userId").value = user.id;
    document.getElementById("userUsername").value = user.username;
    document.getElementById("userEmail").value = user.email;
    document.getElementById("userRol").value = user.rol;
    document.getElementById("userDescription").value = user.description || "";
  } catch (err) {
    showNotification("Error al cargar usuario", "error");
  }
}

async function saveUser() {
  const form = document.getElementById("userForm");
  const userId = document.getElementById("userId").value;
  const username = document.getElementById("userUsername").value.trim();
  const email = document.getElementById("userEmail").value.trim();
  const password = document.getElementById("userPassword").value;
  const rol = document.getElementById("userRol").value;
  const description = document.getElementById("userDescription").value.trim();

  if (!username || !email) {
    showNotification("Completa todos los campos obligatorios", "error");
    return;
  }

  try {
    const body = { username, email, rol, description };
    if (password) body.password = password;

    const url = userId ? `${API_URL}/users/${userId}` : `${API_URL}/users`;
    const method = userId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      showNotification(data.message || "Error al guardar usuario", "error");
      return;
    }

    showNotification(userId ? "Usuario actualizado" : "Usuario creado", "success");
    const modalElement = document.getElementById("userModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
      modalInstance.hide();
    }
    loadUsers();
  } catch (err) {
    showNotification("Error de conexión", "error");
  }
}

async function deleteUser(userId) {
  if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

  try {
    const res = await fetch(`${API_URL}/users/${userId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      showNotification(data.message || "Error al eliminar usuario", "error");
      return;
    }

    showNotification("Usuario eliminado", "success");
    loadUsers();
  } catch (err) {
    showNotification("Error de conexión", "error");
  }
}

// ============================================
// PROJECT MANAGEMENT
// ============================================

async function loadProjects() {
  try {
    const res = await fetch(`${API_URL}/projects?limit=1000`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Error al cargar proyectos");

    const data = await res.json();
    const projects = data.results || [];
    const tbody = document.getElementById("projectsTableBody");
    
    if (projects.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay proyectos</td></tr>';
      return;
    }

    tbody.innerHTML = projects.map(project => {
      const statusText = project.status === "Closed" ? "Cerrado" : 
                        project.status === "Work in progress" ? "En progreso" : 
                        "Buscando miembros";
      const statusColor = project.status === "Closed" ? "#dc2626" : 
                         project.status === "Work in progress" ? "#f59e0b" : 
                         "#10b981";
      
      return `
      <tr>
        <td>${project.id}</td>
        <td>${project.name}</td>
        <td>${project.ownerName || "—"}</td>
        <td>${(project.description || "").substring(0, 50)}${project.description?.length > 50 ? "..." : ""}</td>
        <td>${project.categorias?.join(", ") || "—"}</td>
        <td>
          <span class="badge" style="background: ${statusColor}; color: white; padding: 0.3rem 0.6rem;">
            ${statusText}
          </span>
        </td>
        <td>${project.colaboradores?.length || 0}</td>
        <td>
          <button class="btn btn-sm btn-warning btn-action" onclick="editProject('${project.id}')">
            <i class="fa-solid fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger btn-action" onclick="deleteProject('${project.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
    }).join("");
  } catch (err) {
    showNotification("Error al cargar proyectos", "error");
  }
}

function openProjectModal(projectId = null) {
  currentEditingProjectId = projectId;
  const modalElement = document.getElementById("projectModal");
  const title = document.getElementById("projectModalTitle");
  const form = document.getElementById("projectForm");
  const ownerIdContainer = document.getElementById("ownerIdContainer");
  const ownerIdInput = document.getElementById("projectOwnerId");
  
  form.reset();
  document.getElementById("projectId").value = "";
  
  if (projectId) {
    title.textContent = "Editar Proyecto";
    if (ownerIdContainer) ownerIdContainer.style.display = "none";
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    loadProjectData(projectId);
  } else {
    title.textContent = "Nuevo Proyecto";
    if (ownerIdContainer) ownerIdContainer.style.display = "block";
    if (ownerIdInput) ownerIdInput.required = true;
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
}

async function loadProjectData(projectId) {
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Error al cargar proyecto");

    const project = await res.json();
    document.getElementById("projectId").value = project.id;
    document.getElementById("projectName").value = project.name;
    document.getElementById("projectDescription").value = project.description || "";
    document.getElementById("projectCategories").value = project.categorias?.join(", ") || "";
    document.getElementById("projectStatus").value = project.status || "Looking for members";
    document.getElementById("projectOwnerId").value = project.ownerId;
  } catch (err) {
    showNotification("Error al cargar proyecto", "error");
  }
}

async function saveProject() {
  const form = document.getElementById("projectForm");
  const projectId = document.getElementById("projectId").value;
  const name = document.getElementById("projectName").value.trim();
  const description = document.getElementById("projectDescription").value.trim();
  const categoriesStr = document.getElementById("projectCategories").value.trim();
  const status = document.getElementById("projectStatus").value;
  const ownerId = document.getElementById("projectOwnerId").value.trim();

  if (!name || !description) {
    showNotification("Completa todos los campos obligatorios", "error");
    return;
  }

  const categorias = categoriesStr ? categoriesStr.split(",").map(c => c.trim()).filter(c => c) : [];

  try {
    const body = { name, description, categorias, status };
    
    if (!projectId && ownerId) {
      body.ownerId = ownerId;
    }
    
    if (projectId) {
      const res = await fetch(`${API_URL}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        showNotification(data.message || "Error al actualizar proyecto", "error");
        return;
      }

      showNotification("Proyecto actualizado", "success");
    } else {
      if (!ownerId) {
        showNotification("El ID del dueño es obligatorio para crear un proyecto", "error");
        return;
      }
      
      const res = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        showNotification(data.message || "Error al crear proyecto", "error");
        return;
      }

      showNotification("Proyecto creado", "success");
    }

    const modalElement = document.getElementById("projectModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
      modalInstance.hide();
    }
    loadProjects();
  } catch (err) {
    showNotification("Error de conexión", "error");
  }
}

async function deleteProject(projectId) {
  if (!confirm("¿Estás seguro de eliminar este proyecto?")) return;

  try {
    const res = await fetch(`${API_URL}/projects/${projectId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      showNotification(data.message || "Error al eliminar proyecto", "error");
      return;
    }

    showNotification("Proyecto eliminado", "success");
    loadProjects();
  } catch (err) {
    showNotification("Error de conexión", "error");
  }
}

window.editUser = openUserModal;
window.deleteUser = deleteUser;
window.saveUser = saveUser;
window.openUserModal = openUserModal;
window.editProject = openProjectModal;
window.deleteProject = deleteProject;
window.saveProject = saveProject;
window.openProjectModal = openProjectModal;

