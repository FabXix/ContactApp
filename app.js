require("dotenv").config(); 
const express = require("express");
const path = require("path");
const userRouter = require("./user-router");
const proyectRouter = require("./project-router");
require("./db"); 

const cors = require("cors");
const app = express();
app.use(cors());

app.use(express.json());

const frontendPath = path.join(__dirname, "frontend");

app.use(express.static(frontendPath, {
  extensions: ['html']
}));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use("/users", userRouter);
app.use("/projects", proyectRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
