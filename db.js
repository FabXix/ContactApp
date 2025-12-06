const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/proyectodas";

if (!MONGODB_URI || MONGODB_URI.trim() === "") {
  console.error(" Error: MONGODB_URI no está configurado en el archivo .env");
  console.log(" Por favor, configura MONGODB_URI en tu archivo .env");
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log(" Conectado a MongoDB"))
  .catch(err => {
    console.error(" Error al conectar a MongoDB:", err.message);
    if (err.message.includes("ECONNREFUSED")) {
      console.log("\n💡 MongoDB no está corriendo. Opciones:");
      console.log("   1. Instalar MongoDB localmente: brew tap mongodb/brew && brew install mongodb-community");
      console.log("   2. Iniciar MongoDB: brew services start mongodb-community");
      console.log("   3. O usar MongoDB Atlas (cloud) y actualizar MONGODB_URI en .env");
    }
    process.exit(1);
  });
