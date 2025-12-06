import { fetchProjects } from "./projectsAPI.js";
import { renderProjects } from "./renderProjects.js";

let currentPage = 1;
const limit = 5;
let currentSearch = "";
let currentCategory = "";
let currentOwner = "";

async function loadProjects(page = 1, search = "", category = "", owner = "") {
  currentPage = page;
  currentSearch = search;
  currentCategory = category;
  currentOwner = owner;

const data = await fetchProjects(page, limit, search, category, owner);


  renderProjects(data, (newPage) => loadProjects(newPage, currentSearch, currentCategory, currentOwner));
}

document.addEventListener("DOMContentLoaded", () => {

  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const ownerFilter = document.getElementById("ownerFilter");

  loadProjects();

  if (prevPageBtn) {
    prevPageBtn.addEventListener("click", () => {
      if (currentPage > 1) loadProjects(currentPage - 1, currentSearch, currentCategory, currentOwner);
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener("click", () => {
      loadProjects(currentPage + 1, currentSearch, currentCategory, currentOwner);
    });
  }


  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = searchInput?.value.trim() || "";
      const category = categoryFilter?.value || "";
      const owner = ownerFilter?.value.trim() || "";

      loadProjects(1, query, category, owner); 
    });
  }
});
