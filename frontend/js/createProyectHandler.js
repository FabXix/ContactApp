import { showNotification } from "./notifications.js";
import { getSession } from "./session.js"; // 🔹 sesión unificada

const API_URL = "/projects";

const categoriesContainer = document.getElementById("categoriesContainer");
const selectedCategoriesDiv = document.getElementById("selectedCategories");
const selectedCategories = new Set();

let categoriasDisponibles = [];


const userToken = getSession();
if (!userToken?.id || !userToken?.token) {
  showNotification("Debes iniciar sesión", "error");
  setTimeout(() => window.location.href = "/index.html", 1000);
} else {
}


async function loadCategorias() {
  try {
    const res = await fetch("/data/categorias.json");
    if (!res.ok) throw new Error("No se pudo cargar el archivo JSON");

    const data = await res.json();
    categoriasDisponibles = data.categorias || [];

    renderCategorias();
  } catch (err) {
    showNotification("Error al cargar categorías", "error");
  }
}


function renderCategorias() {
  categoriesContainer.innerHTML = "";
  categoriasDisponibles.forEach(cat => {
    const span = document.createElement("span");
    span.textContent = cat;
    span.classList.add("category-tag");

    span.addEventListener("click", () => {
      if (selectedCategories.has(cat)) {
        selectedCategories.delete(cat);
        span.classList.remove("selected");
      } else {
        selectedCategories.add(cat);
        span.classList.add("selected");
      }
      renderSelectedCategories();
    });

    categoriesContainer.appendChild(span);
  });
}

function renderSelectedCategories() {
  selectedCategoriesDiv.innerHTML = "";
  selectedCategories.forEach(cat => {
    const span = document.createElement("span");
    span.textContent = cat;
    span.classList.add("category-tag", "selected");
    selectedCategoriesDiv.appendChild(span);
  });
}

const form = document.getElementById("createProjectForm");

form.addEventListener("submit", async e => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const description = document.getElementById("description").value.trim();
  const categorias = Array.from(selectedCategories);
  const status = document.getElementById("status").value;

  if (!name || !description || categorias.length === 0) {
    return showNotification("Completa todos los campos ✖", "error");
  }

  const body = {
    name,
    description,
    categorias,
    colaboradores: [], 
    status
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userToken.token}` 
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return showNotification(data.message || "Error al crear proyecto", "error");
    }

    showNotification("Proyecto creado ✔", "success");

    form.reset();
    selectedCategories.clear();
    renderSelectedCategories();


  } catch (err) {
    showNotification("Error en la conexión", "error");
  }
});


loadCategorias();
