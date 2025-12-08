import { openEditModal } from "./editModalHandler.js";
import { handleComments } from "./commentsHandler.js";
import { deleteProject, getUserToken } from "./projectsAPI.js";
import { showNotification } from "./notifications.js";

const API_URL = "/projects";


async function sendJoinRequest(projectId) {
  const user = getUserToken(); 
  try {
    const res = await fetch(`${API_URL}/${projectId}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user.token}`
      }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Error desconocido" }));
      showNotification(errorData.message || "Error al enviar solicitud", "error");
      return false;
    }

    const data = await res.json();
    showNotification(data.message || "Solicitud enviada correctamente", "success");
    return true;

  } catch (err) {
    showNotification("Error de conexión al solicitar unirse", "error");
    return false;
  }
}


async function handleRequestAction(projectId, userId, action) {
  const user = getUserToken();
  try {
    const res = await fetch(`${API_URL}/${projectId}/requests/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user.token}`
      },
      body: JSON.stringify({ action })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Error desconocido" }));
      showNotification(errorData.message || "Error al procesar solicitud", "error");
      return false;
    }

    const data = await res.json();
    const actionText = action === "accept" ? "aceptada" : "rechazada";
    showNotification(data.message || `Solicitud ${actionText} correctamente`, "success");
    return true;

  } catch (err) {
    showNotification("Error de conexión", "error");
    return false;
  }
}

export async function renderProjects(data, reloadCallback) {
  const container = document.getElementById("projectsContainer");
  container.innerHTML = "";

  const projects = data?.results || [];

  if (!projects.length) {
    container.innerHTML = `
      <div class="text-center text-muted mt-5">
        <i class="fa-solid fa-folder-open fa-2x mb-3"></i>
        <p>No hay proyectos disponibles</p>
      </div>`;
    return;
  }

  const user = getUserToken(); 
  const yo = user.uuid; 

  for (const p of projects) {
    const pid = p.id; 

    const post = document.createElement("div");
    post.classList.add("project-post");
    post.style.cssText = `
      font-family: 'Inter', sans-serif;
      width: 95%;
      margin: 1.5rem auto;
      padding: 1.75rem 2rem;
      background: #fff;
      border-radius: 1rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
      transition: all 0.25s ease;
      position: relative;
    `;

    post.innerHTML = `
      <div style="display:flex; justify-content:space-between;">
        <h3 style="font-weight:700; font-size:1.4rem; color:#1e293b;">${p.name}</h3>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <p style="font-size:0.9rem; color:#64748b; margin:0;">
          <i class="fa-solid fa-user me-1"></i>
          <strong>${p.ownerName || "Desconocido"}</strong>
        </p>
        ${p.status ? `
          <span class="badge" style="
            background: ${p.status === "Closed" ? "#dc2626" : p.status === "Work in progress" ? "#f59e0b" : "#10b981"};
            color: white;
            padding: 0.4rem 0.8rem;
            border-radius: 0.5rem;
            font-size: 0.85rem;
            font-weight: 500;
          ">
            ${p.status === "Closed" ? "Cerrado" : p.status === "Work in progress" ? "En progreso" : "Buscando miembros"}
          </span>
        ` : ""}
      </div>

      <p style="font-size:1rem; color:#334155;">${p.description}</p>

      <div style="display:flex; flex-wrap: wrap; gap:0.5rem; margin:1rem 0;">
        ${
          p.categorias
            .map(cat => `<span style="background:#eff6ff; color:#1d4ed8; padding:0.3rem 0.6rem; border-radius:0.5rem;">${cat}</span>`)
            .join("")
        }
      </div>

      <div class="comments-container" style="border-top:1px solid #f1f5f9; padding-top:1rem;"></div>

      <form class="add-comment-form d-flex mt-3">
        <input type="text" placeholder="Escribe un comentario..." class="form-control me-2" required>
        <button class="btn btn-primary btn-sm">Comentar</button>
      </form>

      <div class="join-container mt-3"></div>
      <div class="requests-container mt-3" style="margin-top: 1rem !important;"></div>
    `;

    p.userRole = user.rol;
    handleComments(p, post.querySelector(".comments-container"), reloadCallback);

    const joinContainer = post.querySelector(".join-container");
    const requestsContainer = post.querySelector(".requests-container");


    if (p.ownerId === yo) {
    } else if (p.colaboradores?.includes(yo)) {
      const badge = document.createElement("span");
      badge.innerHTML = '<i class="fa-solid fa-check-circle me-1"></i> Colaborador';
      badge.classList.add("badge", "bg-success");
      badge.style.cssText = "padding: 0.5rem 1rem; font-size: 0.875rem;";
      joinContainer.appendChild(badge);
    } else if (p.solicitudesColaboracion?.includes(yo)) {
      const badge = document.createElement("span");
      badge.innerHTML = '<i class="fa-solid fa-clock me-1"></i> Solicitud pendiente';
      badge.classList.add("badge", "bg-warning", "text-dark");
      badge.style.cssText = "padding: 0.5rem 1rem; font-size: 0.875rem;";
      joinContainer.appendChild(badge);
    } else {
      const btn = document.createElement("button");
      btn.innerHTML = '<i class="fa-solid fa-user-plus me-1"></i> Solicitar colaborar';
      btn.classList.add("btn", "btn-outline-primary", "btn-sm");
      btn.style.cssText = "margin-top: 0.5rem;";

      btn.addEventListener("click", async () => {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Enviando...';
        if (await sendJoinRequest(pid)) {
          reloadCallback();
        } else {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-user-plus me-1"></i> Solicitar colaborar';
        }
      });

      joinContainer.appendChild(btn);
    }


    if (p.ownerId === yo && p.solicitudesColaboracion?.length) {
      const title = document.createElement("p");
      title.textContent = "Solicitudes de colaboración:";
      title.style.fontWeight = "600";
      title.style.marginBottom = "0.5rem";
      requestsContainer.appendChild(title);

      p.solicitudesColaboracion.forEach(async (userId) => {
        const requestDiv = document.createElement("div");
        requestDiv.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #f8fafc;
          border-radius: 0.375rem;
          border: 1px solid #e2e8f0;
        `;

        const userNameSpan = document.createElement("span");
        userNameSpan.textContent = "Cargando...";
        userNameSpan.style.fontWeight = "500";
        requestDiv.appendChild(userNameSpan);

        try {
          const userRes = await fetch(`/users/${userId}`, {
            headers: {
              "Authorization": `Bearer ${user.token}`
            }
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            userNameSpan.textContent = userData.username || "Usuario desconocido";
          } else {
            userNameSpan.textContent = "Usuario desconocido";
          }
        } catch (err) {
          userNameSpan.textContent = userId.substring(0, 8) + "...";
        }

        const buttonsDiv = document.createElement("div");
        buttonsDiv.style.cssText = "display: flex; gap: 0.5rem;";

        const acceptBtn = document.createElement("button");
        acceptBtn.innerHTML = '<i class="fa-solid fa-check"></i> Aceptar';
        acceptBtn.classList.add("btn", "btn-success", "btn-sm");
        acceptBtn.addEventListener("click", async () => {
          if (await handleRequestAction(pid, userId, "accept")) reloadCallback();
        });

        const rejectBtn = document.createElement("button");
        rejectBtn.innerHTML = '<i class="fa-solid fa-times"></i> Rechazar';
        rejectBtn.classList.add("btn", "btn-danger", "btn-sm");
        rejectBtn.addEventListener("click", async () => {
          if (await handleRequestAction(pid, userId, "reject")) reloadCallback();
        });

        buttonsDiv.appendChild(acceptBtn);
        buttonsDiv.appendChild(rejectBtn);
        requestDiv.appendChild(buttonsDiv);
        requestsContainer.appendChild(requestDiv);
      });
    }

    if (user.rol === "Admin" || user.uuid === p.ownerId) {
      const menuContainer = document.createElement("div");
      menuContainer.style.cssText = `position:absolute; top:1.2rem; right:1.2rem;`;

      const menuBtn = document.createElement("button");
      menuBtn.innerHTML = `<i class="fa-solid fa-ellipsis-vertical"></i>`;
      menuBtn.style.cssText = `background:transparent; border:none; cursor:pointer; color:#64748b;`;

      const dropdown = document.createElement("div");
      dropdown.style.cssText = `
        display:none; position:absolute; right:0; top:120%;
        background:#fff; border:1px solid #e2e8f0; border-radius:0.5rem;
        box-shadow:0 8px 20px rgba(0,0,0,0.08);
        overflow:hidden; min-width:130px;
      `;

      dropdown.innerHTML = `
        <div class="dropdown-item" style="padding:0.6rem 1rem; cursor:pointer;">
          <i class="fa-solid fa-pen me-2"></i> Editar
        </div>
        <div class="dropdown-item" style="padding:0.6rem 1rem; cursor:pointer; color:#dc2626;">
          <i class="fa-solid fa-trash me-2"></i> Eliminar
        </div>
      `;

      menuContainer.appendChild(menuBtn);
      menuContainer.appendChild(dropdown);
      post.appendChild(menuContainer);

      menuBtn.addEventListener("click", e => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
      });

      const [editItem, deleteItem] = dropdown.children;

      editItem.addEventListener("click", () => {
        openEditModal(p, reloadCallback);
        dropdown.style.display = "none";
      });

      deleteItem.addEventListener("click", async () => {
        if (await deleteProject(pid)) reloadCallback();
        dropdown.style.display = "none";
      });

      document.addEventListener("click", e => {
        if (!menuContainer.contains(e.target)) dropdown.style.display = "none";
      });
    }

    container.appendChild(post);
  }

  // ----------------------
  // PAGINACIÓN
  // ----------------------
  const pagination = document.createElement("div");
  pagination.style.cssText = `
    display:flex; justify-content:center;
    gap:1rem; margin:1.5rem 0;
  `;

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Anterior";
  prevBtn.classList.add("btn", "btn-secondary", "btn-sm");
  prevBtn.disabled = data.page <= 1;
  prevBtn.onclick = () => reloadCallback(data.page - 1);

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Siguiente";
  nextBtn.classList.add("btn", "btn-secondary", "btn-sm");
  const totalPages = Math.ceil(data.total / data.limit);
  nextBtn.disabled = data.page >= totalPages;
  nextBtn.onclick = () => reloadCallback(data.page + 1);

  pagination.appendChild(prevBtn);
  pagination.appendChild(nextBtn);
  container.appendChild(pagination);
}
