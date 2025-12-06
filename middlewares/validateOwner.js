// middlewares/validateOwner.js
const Project = require("../models/Project");

async function validateOwner(req, res, next) {
  const userId = req.userId;      
  const role = req.userRole;     
  const projectId = req.params.projectId;

  const project = await Project.findOne({ id: projectId }).lean();

  if (!project) {
    return res.status(404).json({ message: "Proyecto no encontrado" });
  }

  if (role === "Admin") {
    req.project = project;
    return next();
  }

  if (project.dueño !== userId) {
    return res.status(403).json({ message: "No eres el dueño del proyecto" });
  }

  req.project = project;
  next();
}

module.exports = validateOwner;
