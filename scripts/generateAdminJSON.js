const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function generateAdminJSON() {
  const password = 'admin@123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const adminUser = {
    _uuid: uuidv4(),
    _username: 'admin',
    _password: hashedPassword,
    _email: 'admin@gmail.com',
    _description: 'Administrador del sistema',
    _rol: 'Admin',
    _proyectosDueño: [],
    _proyectosColaborador: []
  };
  
  console.log(JSON.stringify(adminUser, null, 2));
}

generateAdminJSON();

