// frontend/api/projectsAPI.js

import { getSession } from "../js/session.js";

const API_URL = "http://localhost:3000";


export function getUserToken() {
  const session = getSession();
  if (!session) return null;

  return {
    uuid: session.id,     
    username: session.username,
    rol: session.rol,
    token: session.token
  };
}

function authHeaders() {
  const session = getSession();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.token || ""}`
  };
}


export async function fetchProjects(
  page = 1,
  limit = 5,
  search = "",
  categoria = "",
  owner = ""
) {
  const params = new URLSearchParams();

  params.append("page", page);
  params.append("limit", limit);


  if (search) params.append("search", search);      
  if (categoria) params.append("categoria", categoria);
  if (owner) params.append("owner", owner);

  const url = `${API_URL}/projects?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: authHeaders()
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();

  } catch (err) {
    throw err;
  }
}


export async function fetchProjectById(projectId) {
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}`, {
      method: "GET",
      headers: authHeaders()
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();

  } catch (err) {
    throw err;
  }
}


export async function createProject(projectData) {
  try {
    const res = await fetch(`${API_URL}/projects`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(projectData)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();

  } catch (err) {
    throw err;
  }
}


export async function requestCollaboration(projectId) {
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}/request`, {
      method: "POST",
      headers: authHeaders()
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();

  } catch (err) {
    throw err;
  }
}

export async function addComment(projectId, content) {
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}/comment`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ contenido: content })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();

  } catch (err) {
    throw err;
  }
}


export async function updateProject(projectId, body) {
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Error al actualizar");
    }

    return { ok: true };

  } catch (err) {
    console.error("❌ updateProject error:", err);
    return { ok: false, error: err.message };
  }
}


export async function deleteProject(projectId) {
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;

  } catch (err) {
    return false;
  }
}
