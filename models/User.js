const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  _uuid: { type: String, required: true, unique: true },
  _username: { type: String, required: true },
  _password: { type: String, required: true },
  _email: { type: String, required: true, unique: true },
  _description: { type: String },
  _proyectosDueño: [{ type: String }],          
  _proyectosColaborador: [{ type: String }],   
  _rol: { type: String, enum: ["Estudiante", "Docente", "Admin"], default: "Estudiante" }
});

module.exports = mongoose.model("User", userSchema);
