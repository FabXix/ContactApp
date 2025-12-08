import { getUserToken } from "./projectsAPI.js";

async function getUserNameById(userId) {
  const userToken = getUserToken();
  try {
    const res = await fetch(`http://localhost:3000/users/${userId}`, {
      headers: {
        "x-user": userToken.uuid,
        "x-auth": userToken.rol
      }
    });
    if (!res.ok) throw new Error("Usuario no encontrado");
    const data = await res.json();
    return data.name || "Desconocido";
  } catch (err) {
    console.error(err);
    return "Desconocido";
  }
}

async function renderPendingRequests(p, requestsContainer) {
  const userToken = getUserToken();

  if (p.dueño === userToken.uuid && p.solicitudesColaboracion?.length) {
    const title = document.createElement("p");
    title.textContent = "Solicitudes pendientes:";
    title.style.fontWeight = "600";
    requestsContainer.appendChild(title);

    const users = await Promise.all(
      p.solicitudesColaboracion.map(uid => getUserNameById(uid))
    );

    users.forEach((name, index) => {
      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.alignItems = "center";
      div.style.gap = "0.5rem";
      div.style.marginTop = "0.3rem";

      div.textContent = name;

      const acceptBtn = document.createElement("button");
      acceptBtn.textContent = "✔";
      acceptBtn.classList.add("btn", "btn-success", "btn-sm");
      acceptBtn.addEventListener("click", async () => {
        await handleRequest(p.id, p.solicitudesColaboracion[index], "accept");
        div.remove(); 
      });

      const rejectBtn = document.createElement("button");
      rejectBtn.textContent = "✖";
      rejectBtn.classList.add("btn", "btn-danger", "btn-sm");
      rejectBtn.addEventListener("click", async () => {
        await handleRequest(p.id, p.solicitudesColaboracion[index], "reject");
        div.remove();
      });

      div.appendChild(acceptBtn);
      div.appendChild(rejectBtn);
      requestsContainer.appendChild(div);
    });
  }
}

async function handleRequest(projectId, userId, action) {
  const userToken = getUserToken();
  try {
    const res = await fetch(`/projects/${projectId}/requests/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user": userToken.uuid,
        "x-auth": userToken.rol
      },
      body: JSON.stringify({ action })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al procesar solicitud");
    console.log(data.message);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

export { renderPendingRequests };
