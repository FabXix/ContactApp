import { showNotification } from "./notifications.js";
import { getToken, getUserId } from "./session.js";

export function handleComments(p, container, reloadCallback) {

  const token = getToken();
  const userId = getUserId();

  function loadComments() {
    container.innerHTML = "";

    if (!p.comentarios || p.comentarios.length === 0) {
      container.innerHTML = `
        <p class="text-muted" style="font-size:0.875rem;">No hay comentarios aún.</p>
      `;
      return;
    }

    p.comentarios.forEach(c => {
      const div = document.createElement("div");
      div.style.cssText = 
        "padding:0.5rem 0; font-size:0.875rem; display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #f1f5f9;";


      const commentUserId = String(c.usuario || c.userId || "").trim();
      const currentUserId = String(userId || "").trim();
      const isOwner = commentUserId === currentUserId && commentUserId !== "";
      const isAdmin = String(p.userRole || "").trim() === "Admin";
      const canEdit = isOwner || isAdmin;
      const canDelete = isOwner || isAdmin;

      const commentContent = document.createElement("div");
      commentContent.style.flex = "1";
      
      const commentText = document.createElement("div");
      commentText.id = `comment-text-${c.id}`;
      commentText.innerHTML = `<strong>${c.nombreUsuario}</strong>: <span id="comment-content-${c.id}">${c.contenido}</span>`;
      commentContent.appendChild(commentText);

      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.id = `edit-input-${c.id}`;
      editInput.value = c.contenido;
      editInput.style.cssText = "display:none; width:100%; padding:0.25rem; margin-top:0.25rem; border:1px solid #3b82f6; border-radius:0.25rem;";
      commentContent.appendChild(editInput);

      div.appendChild(commentContent);

      if (canEdit || canDelete) {
        const actionsDiv = document.createElement("div");
        actionsDiv.style.cssText = "display:flex; gap:0.25rem; margin-left:0.5rem;";

        if (canEdit) {
          const editBtn = document.createElement("button");
          editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
          editBtn.title = "Editar comentario";
          editBtn.classList.add("btn", "btn-sm");
          editBtn.style.cssText = 
            "background:#3b82f6;color:#fff;font-weight:600; padding:0.25rem 0.5rem; font-size:0.75rem; border:none; border-radius:0.25rem; cursor:pointer;";

          let isEditing = false;
          editBtn.addEventListener("click", async () => {
            if (!isEditing) {
              isEditing = true;
              commentText.style.display = "none";
              editInput.style.display = "block";
              editBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
              editBtn.title = "Guardar";
              editInput.focus();
            } else {
              const newContent = editInput.value.trim();
              if (!newContent) {
                showNotification("El comentario no puede estar vacío", "error");
                return;
              }

              try {
                const res = await fetch(
                  `http://localhost:3000/projects/${p.id}/comments/${c.id}`,
                  {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ contenido: newContent })
                  }
                );

                if (!res.ok) {
                  const errorData = await res.json().catch(() => ({ message: "Error desconocido" }));
                  showNotification(errorData.message || "Error al actualizar comentario", "error");
                  return;
                }

                const data = await res.json();

                c.contenido = newContent;
                if (data.comentario) {
                  Object.assign(c, data.comentario);
                }

                document.getElementById(`comment-content-${c.id}`).textContent = newContent;
                commentText.style.display = "block";
                editInput.style.display = "none";
                editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                editBtn.title = "Editar comentario";
                isEditing = false;
                showNotification("Comentario actualizado ✔", "success");
                reloadCallback();

              } catch (err) {
                showNotification("Error de conexión al actualizar comentario", "error");
              }
            }
          });

          editInput.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
              editInput.value = c.contenido;
              commentText.style.display = "block";
              editInput.style.display = "none";
              editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
              editBtn.title = "Editar comentario";
              isEditing = false;
            } else if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              editBtn.click();
            }
          });

          actionsDiv.appendChild(editBtn);
        }

        if (canDelete) {
          const delBtn = document.createElement("button");
          delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
          delBtn.title = "Eliminar comentario";
          delBtn.classList.add("btn", "btn-sm");
          delBtn.style.cssText = 
            "background:#ef4444;color:#fff;font-weight:600; padding:0.25rem 0.5rem; font-size:0.75rem;";

          delBtn.addEventListener("click", async () => {
            if (!confirm("¿Eliminar este comentario?")) return;

            try {
              const res = await fetch(
                `http://localhost:3000/projects/${p.id}/comments/${c.id}`,
                {
                  method: "DELETE",
                  headers: {
                    "Authorization": `Bearer ${token}`
                  }
                }
              );

              if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: "Error desconocido" }));
                showNotification(errorData.message || "Error al eliminar comentario", "error");
                return;
              }

              const data = await res.json();

              showNotification("Comentario eliminado ✔", "success");
              p.comentarios = p.comentarios.filter(com => com.id !== c.id);
              loadComments();
              reloadCallback();

            } catch (err) {
              showNotification("Error de conexión al eliminar comentario", "error");
            }
          });

          actionsDiv.appendChild(delBtn);
        }

        div.appendChild(actionsDiv);
      }

      container.appendChild(div);
    });
  }

  loadComments();

  const form = container.parentElement.querySelector(".add-comment-form");

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const input = form.querySelector("input");
    const contenido = input.value.trim();
    if (!contenido) return;

    try {
      const res = await fetch(
        `http://localhost:3000/projects/${p.id}/comments`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ contenido })
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Error desconocido" }));
        showNotification(errorData.message || "Error al agregar comentario", "error");
        return;
      }

      const data = await res.json();

      input.value = "";
      showNotification("Comentario agregado ✔", "success");
      
      if (data.comentario) {
        if (!p.comentarios) p.comentarios = [];
        p.comentarios.push(data.comentario);
      }
      
      loadComments();
      reloadCallback();

    } catch (err) {
      showNotification("Error de conexión al crear comentario", "error");
    }
  });
}
