// middlewares/validateUser.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SECRET = process.env.JWT_SECRET || "SECRETITO";

module.exports = async function validateUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);

    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    req.userId = user._id.toString();
    req.userRole = user._rol;

    req.user = {
      id: user._id.toString(),
      username: user._username,
      rol: user._rol
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
};
