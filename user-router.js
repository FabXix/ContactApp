const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const validateUser = require("./middlewares/validateUser");
const validateAdmin = require("./middlewares/validateAdmin");
const User = require("./models/User");

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "SECRETITO";

// =====================================================
// Helper para sanitizar usuario
// =====================================================
function cleanUser(u) {
  if (!u) return null;

  return {
    id: u._id.toString(),
    username: u._username,
    email: u._email,
    description: u._description,
    rol: u._rol,
    proyectosDueño: u._proyectosDueño,
    proyectosColaborador: u._proyectosColaborador,
  };
}

// =====================================================
// Crear usuario
// =====================================================
router.post("/", async (req, res) => {
  try {
    const { username, password, email, description, rol } = req.body;

    if (!username || !password || !email)
      return res.status(400).json({ message: "Faltan campos obligatorios" });

    const existing = await User.findOne({ _email: email });
    if (existing)
      return res.status(400).json({ message: "Correo ya registrado" });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      _uuid: uuidv4(),
      _username: username,
      _password: hashed,
      _email: email,
      _description: description || "",
      _rol: rol || "Estudiante",
      _proyectosDueño: [],
      _proyectosColaborador: []
    });

    res.status(201).json({
      message: "Usuario creado",
      user: cleanUser(newUser)
    });

  } catch (err) {
    res.status(500).json({ message: "Error al crear usuario" });
  }
});

// =====================================================
// Login
// =====================================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ _email: email });
    if (!user) return res.status(401).json({ message: "Usuario no existe" });

    const ok = await bcrypt.compare(password, user._password);
    if (!ok) return res.status(401).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign(
      {
        id: user._id.toString(),
        rol: user._rol,
        username: user._username
      },
      SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login exitoso",
      token,
      user: cleanUser(user)
    });

  } catch (err) {
    res.status(500).json({ message: "Error login" });
  }
});

// =====================================================
// Obtener todos los usuarios
// =====================================================
router.get("/", validateUser, async (req, res) => {
  try {
    const users = await User.find();

    if (req.userRole === "Admin")
      return res.json(users.map(cleanUser));

    const filtered = users.map(u => ({
      id: u._id.toString(),
      username: u._username,
      description: u._description,
      rol: u._rol
    }));

    res.json(filtered);

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

// =====================================================
// Obtener usuario por ID
// =====================================================
router.get("/:id", validateUser, async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: "No encontrado" });

    const isOwner = req.userId === u._id.toString();
    const isAdmin = req.userRole === "Admin";

    if (isOwner || isAdmin) return res.json(cleanUser(u));

    return res.json({
      id: u._id.toString(),
      username: u._username,
      description: u._description,
      rol: u._rol
    });

  } catch {
    res.status(500).json({ message: "Error" });
  }
});

// =====================================================
// Editar usuario
// =====================================================
router.put("/:id", validateUser, async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: "No encontrado" });

    const isOwner = req.userId === u._id.toString();
    const isAdmin = req.userRole === "Admin";

    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: "No autorizado" });

    if (req.body.password)
      u._password = await bcrypt.hash(req.body.password, 10);

    if (req.body.email) {
      const exists = await User.findOne({ _email: req.body.email });
      if (exists && exists._id.toString() !== req.params.id)
        return res.status(400).json({ message: "Correo ya registrado" });

      u._email = req.body.email;
    }

    if (req.body.username !== undefined) {
      u._username = req.body.username.trim();
    }

    if (req.body.description !== undefined) {
      u._description = req.body.description.trim() || "";
    }

    if (req.body.rol && isAdmin)
      u._rol = req.body.rol;

    await u.save();

    res.json({ message: "Actualizado", user: cleanUser(u) });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Error de validación", 
        errors: err.errors 
      });
    }
    res.status(500).json({ 
      message: "Error al actualizar perfil",
      error: err.message 
    });
  }
});

// =====================================================
// Eliminar usuario
// =====================================================
router.delete("/:id", validateUser, validateAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Eliminado" });
  } catch {
    res.status(500).json({ message: "Error" });
  }
});

module.exports = router;
