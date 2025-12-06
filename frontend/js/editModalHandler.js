import { updateProject } from "./projectsAPI.js";
import { showNotification } from "./notifications.js";

export function openEditModal(project, reloadCallback) {
  const modal = document.getElementById("editModal");
  const form = modal.querySelector("#editForm");

  const nameInput = form.querySelector('input[name="name"]');
  const descriptionInput = form.querySelector('textarea[name="description"]');
  const statusInput = form.querySelector('select[name="status"]');

  let categoriesContainer = form.querySelector("#editCategoriesContainer");
  let selectedCategoriesDiv = form.querySelector("#editSelectedCategories");

  if (!categoriesContainer) {
    categoriesContainer = document.createElement("div");
    categoriesContainer.id = "editCategoriesContainer";
    form.querySelector('input[name="categorias"]').replaceWith(categoriesContainer);
  }

  if (!selectedCategoriesDiv) {
    selectedCategoriesDiv = document.createElement("div");
    selectedCategoriesDiv.id = "editSelectedCategories";
    selectedCategoriesDiv.style.marginTop = "5px";
    categoriesContainer.after(selectedCategoriesDiv);
  }

  nameInput.value = project.name;
  descriptionInput.value = project.description;
  if (statusInput) {
    statusInput.value = project.status || "Looking for members";
  }

  const selectedCategories = new Set(project.categorias);

  function renderSelected() {
    selectedCategoriesDiv.innerHTML = "";
    selectedCategories.forEach(cat => {
      const span = document.createElement("span");
      span.textContent = cat;
      span.classList.add("category-tag", "selected");
      selectedCategoriesDiv.appendChild(span);
    });
  }

  fetch("/data/categorias.json")
    .then(res => res.json())
    .then(data => {
      const categoriasDisponibles = data.categorias || [];
      categoriesContainer.innerHTML = "";

      categoriasDisponibles.forEach(cat => {
        const span = document.createElement("span");
        span.textContent = cat;
        span.classList.add("category-tag");

        if (selectedCategories.has(cat)) span.classList.add("selected");

        span.addEventListener("click", () => {
          if (selectedCategories.has(cat)) selectedCategories.delete(cat);
          else selectedCategories.add(cat);

          if (selectedCategories.has(cat)) span.classList.add("selected");
          else span.classList.remove("selected");

          renderSelected();
        });

        categoriesContainer.appendChild(span);
      });

      renderSelected();
    });

  form.onsubmit = async (e) => {
    e.preventDefault();

    const updatedProject = {
      name: nameInput.value,
      description: descriptionInput.value,
      categorias: Array.from(selectedCategories),
      status: statusInput ? statusInput.value : "Looking for members"
    };

    const projectId = project.id || project._id; 

    const { ok } = await updateProject(projectId, updatedProject);

    if (ok) {
      showNotification("Proyecto actualizado ✔", "success");
      const bootstrapModal = bootstrap.Modal.getInstance(modal);
      bootstrapModal.hide();
      reloadCallback();
    }
  };

  new bootstrap.Modal(modal).show();
}
