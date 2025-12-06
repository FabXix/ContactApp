// middlewares/validateAdmin.js
module.exports = function validateAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  if (req.user.rol !== "Admin") {
    return res.status(403).json({ message: "Solo administradores" });
  }

  next();
};
