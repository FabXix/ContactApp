const mongoose = require("mongoose");

const comentarioSchema = new mongoose.Schema({
  id: { type: String, required: true },
  usuario: { type: String, required: true },       
  nombreUsuario: { type: String, required: true },
  contenido: { type: String, required: true },
  fecha: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  ownerName: { type: String, required: true },
  colaboradores: [{ type: String }],             
  description: { type: String },
  comentarios: [comentarioSchema],
  solicitudesColaboracion: [{ type: String }],   
  categorias: [{ type: String }],
  status: { 
    type: String, 
    enum: ["Looking for members", "Work in progress", "Closed"], 
    default: "Looking for members" 
  }
});

module.exports = mongoose.model("Project", projectSchema);
