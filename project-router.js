const express = require("express");
const shortid = require("shortid");
const validateUser = require("./middlewares/validateUser");
const validateAdmin = require("./middlewares/validateAdmin");
const validateOwner = require("./middlewares/validateOwner");
const Project = require("./models/Project");
const User = require("./models/User");

const router = express.Router();

/*──────────────────────────────────────────────
  POST /projects → Crear proyecto
──────────────────────────────────────────────*/
router.post("/", validateUser, async (req, res) => {
  try {
    const { name, description, categorias = [], colaboradores = [], status = "Looking for members", ownerId: providedOwnerId } = req.body;

    if (!name || !description)
      return res.status(400).json({ message: "Faltan campos obligatorios" });

    const isAdmin = req.userRole === "Admin";
    const targetOwnerId = (isAdmin && providedOwnerId) ? providedOwnerId : req.userId;

    if (!isAdmin && providedOwnerId && providedOwnerId !== req.userId) {
      return res.status(403).json({ message: "No puedes crear proyectos para otros usuarios" });
    }

    const owner = await User.findById(targetOwnerId).select("_id _username").lean();
    if (!owner) return res.status(400).json({ message: "Usuario creador no existe" });

    const validColabs = await User.find({ _id: { $in: colaboradores } }).select("_id");

    const ownerName = owner._username || req.user?.username;
    if (!ownerName) {
      return res.status(400).json({ message: "Error: nombre de usuario no disponible" });
    }

    const newProject = await Project.create({
      id: shortid.generate(),
      name,
      description,
      ownerId: owner._id.toString(),
      ownerName: ownerName,
      colaboradores: validColabs.map(c => c._id.toString()),
      categorias,
      comentarios: [],
      solicitudesColaboracion: [],
      status
    });

    res.status(201).json(newProject);

  } catch (err) {
    res.status(500).json({ message: "Error al crear proyecto" });
  }
});

/*──────────────────────────────────────────────
  GET /projects → Lista con filtros (FUNCIONANDO)
──────────────────────────────────────────────*/
router.get("/", validateUser, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      categoria = "", 
      owner = "" 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } },
        { categorias: { $regex: search, $options: "i" } }
      ];
    }

    if (categoria) {
      query.categorias = categoria; 
    }

    if (owner) {
      query.ownerId = owner;
    }

    const total = await Project.countDocuments(query);
    const results = await Project.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      results
    });

  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/*──────────────────────────────────────────────
  GET /projects/:projectId → Proyecto individual
──────────────────────────────────────────────*/
router.get("/:projectId", validateUser, async (req, res) => {
  try {
    const project = await Project.findOne({ id: req.params.projectId });

    if (!project) return res.status(404).json({ message: "Proyecto no encontrado" });

    const userId = req.userId;
    const isAdmin = req.userRole === "Admin";

    if (isAdmin || project.ownerId === userId) return res.json(project);

    if (project.colaboradores.includes(userId)) {
      const { ownerId, ...rest } = project.toObject();
      return res.json(rest);
    }

    const { id, name, description, categorias, comentarios, ownerName } = project;
    res.json({ id, name, description, categorias, comentarios, ownerName });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Error de validación", errors: err.errors });
    }
    res.status(500).json({ message: "Error interno" });
  }
});

/*──────────────────────────────────────────────
  PUT /projects/:projectId → Editar proyecto
──────────────────────────────────────────────*/
router.put("/:projectId", validateUser, async (req, res) => {
  try {
    const project = await Project.findOne({ id: req.params.projectId });
    if (!project) return res.status(404).json({ message: "Proyecto no encontrado" });

    const isAdmin = req.userRole === "Admin";

    if (!isAdmin && project.ownerId !== req.userId) {
      return res.status(403).json({ message: "No eres el dueño del proyecto" });
    }

    const allowedFields = ["name", "description", "categorias", "colaboradores", "status"];
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) project[f] = req.body[f];
    });

    await project.save();
    res.json({ message: "Proyecto actualizado", project });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Error de validación", errors: err.errors });
    }
    res.status(500).json({ message: "Error interno" });
  }
});

/*──────────────────────────────────────────────
  DELETE /projects/:projectId
──────────────────────────────────────────────*/
router.delete("/:projectId", validateUser, async (req, res) => {
  try {
    const project = await Project.findOne({ id: req.params.projectId });
    if (!project) return res.status(404).json({ message: "Proyecto no encontrado" });

    const isAdmin = req.userRole === "Admin";

    if (!isAdmin && project.ownerId !== req.userId)
      return res.status(403).json({ message: "No tienes permiso para eliminar" });

    await Project.deleteOne({ id: req.params.projectId });
    res.json({ message: "Proyecto eliminado" });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Error de validación", errors: err.errors });
    }
    res.status(500).json({ message: "Error interno" });
  }
});

/*──────────────────────────────────────────────
  PUT /projects/:projectId/comments/:commentId → Editar comentario
──────────────────────────────────────────────*/
router.put("/:projectId/comments/:commentId", validateUser, async (req, res) => {
  try {
    const project = await Project.findOne({ id: req.params.projectId });
    if (!project) return res.status(404).json({ message: "Proyecto no encontrado" });

    const comment = project.comentarios.find(c => c.id === req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comentario no encontrado" });

    const commentUserId = comment.usuario || comment.userId;
    if (commentUserId !== req.userId && req.userRole !== "Admin")
      return res.status(403).json({ message: "No tienes permiso" });

    const { contenido } = req.body;
    if (!contenido || contenido.trim() === "") {
      return res.status(400).json({ message: "El contenido del comentario no puede estar vacío" });
    }

    comment.contenido = contenido.trim();
    
    project.markModified('comentarios');
    
    await project.save();
    
    res.json({ message: "Comentario actualizado", comentario: comment });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Error de validación", errors: err.errors });
    }
    res.status(500).json({ message: "Error interno" });
  }
});

/*──────────────────────────────────────────────
  PUT /projects/:projectId/comments  Agregar comentario
──────────────────────────────────────────────*/
router.put("/:projectId/comments", validateUser, async (req, res) => {
  try {
    const project = await Project.findOne({ id: req.params.projectId });
    if (!project) return res.status(404).json({ message: "Proyecto no encontrado" });

    const { contenido } = req.body;
    if (!contenido || contenido.trim() === "") {
      return res.status(400).json({ message: "El contenido del comentario no puede estar vacío" });
    }

    // Validar que tenemos los datos del usuario
    if (!req.userId || !req.user || !req.user.username) {
      return res.status(400).json({ message: "Error: datos de usuario no disponibles" });
    }

    const newComment = {
      id: shortid.generate(),
      usuario: req.userId,
      nombreUsuario: req.user.username,
      contenido: contenido.trim(),
      fecha: new Date()
    };

    if (!project.comentarios) {
      project.comentarios = [];
    }

    project.comentarios.push(newComment);
    
    project.markModified('comentarios');
    
    const savedProject = await project.save();
    
    const savedComment = savedProject.comentarios.find(c => c.id === newComment.id);
    
    res.status(201).json({
      message: "Comentario agregado",
      comentario: savedComment || savedProject.comentarios.at(-1)
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Error de validación", 
        errors: err.errors
      });
    }
    res.status(500).json({ 
      message: "Error interno al guardar comentario"
    });
  }
});

/*──────────────────────────────────────────────
  DELETE comentario
──────────────────────────────────────────────*/
router.delete("/:projectId/comments/:commentId", validateUser, async (req, res) => {
  try {
    const project = await Project.findOne({ id: req.params.projectId });
    if (!project) return res.status(404).json({ message: "Proyecto no encontrado" });

    const comment = project.comentarios.find(c => c.id === req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comentario no encontrado" });

    const commentUserId = comment.usuario || comment.userId;
    if (commentUserId !== req.userId && req.userRole !== "Admin")
      return res.status(403).json({ message: "No tienes permiso" });

    project.comentarios = project.comentarios.filter(c => c.id !== req.params.commentId);
    
    project.markModified('comentarios');
    
    await project.save();

    res.json({ message: "Comentario eliminado" });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Error de validación", errors: err.errors });
    }
    res.status(500).json({ message: "Error interno" });
  }
});

/*──────────────────────────────────────────────
  POST solicitud de unión
──────────────────────────────────────────────*/
router.post("/:projectId/join", validateUser, async (req, res) => {
  try {
    const project = await Project.findOne({ id: req.params.projectId });
    if (!project) return res.status(404).json({ message: "Proyecto no encontrado" });

    const userId = req.userId;

    if (project.ownerId === userId || project.colaboradores.includes(userId))
      return res.status(400).json({ message: "Ya formas parte del proyecto" });

    if (project.solicitudesColaboracion.includes(userId))
      return res.status(400).json({ message: "Ya has enviado una solicitud para este proyecto" });

    project.solicitudesColaboracion.push(userId);
    
    project.markModified('solicitudesColaboracion');
    
    await project.save();
    
    res.status(201).json({ message: "Solicitud de colaboración enviada correctamente" });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Error de validación", errors: err.errors });
    }
    res.status(500).json({ message: "Error interno al enviar solicitud" });
  }
});

/*──────────────────────────────────────────────
  PUT aceptar/rechazar solicitud
──────────────────────────────────────────────*/
router.put("/:projectId/requests/:userId", validateUser, async (req, res) => {
  try {
    const project = await Project.findOne({ id: req.params.projectId });
    if (!project) return res.status(404).json({ message: "Proyecto no encontrado" });

    if (project.ownerId !== req.userId && req.userRole !== "Admin")
      return res.status(403).json({ message: "No tienes permiso para gestionar solicitudes de este proyecto" });

    const { action } = req.body;
    const userId = req.params.userId;

    if (!action || !["accept", "reject"].includes(action))
      return res.status(400).json({ message: "Acción inválida. Debe ser 'accept' o 'reject'" });

    if (!project.solicitudesColaboracion.includes(userId))
      return res.status(400).json({ message: "No hay solicitud de colaboración de este usuario" });

    if (action === "accept") {
      if (!project.colaboradores.includes(userId)) {
        project.colaboradores.push(userId);
        project.markModified('colaboradores');
      }
    }

    project.solicitudesColaboracion =
      project.solicitudesColaboracion.filter(id => id !== userId);
    
    project.markModified('solicitudesColaboracion');
    
    await project.save();
    
    const actionText = action === "accept" ? "aceptada" : "rechazada";
    
    res.json({ message: `Solicitud ${actionText} correctamente` });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Error de validación", errors: err.errors });
    }
    res.status(500).json({ message: "Error interno al procesar solicitud" });
  }
});

module.exports = router;
