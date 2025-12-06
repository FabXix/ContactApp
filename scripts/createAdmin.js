require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const db = require('../db');

async function createAdmin() {
  try {
    await db;
    
    const email = 'admin@gmail.com';
    const password = 'admin@123';
    const username = 'admin';
    
    const existing = await User.findOne({ _email: email });
    if (existing) {
      console.log('Admin user already exists!');
      process.exit(0);
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await User.create({
      _uuid: uuidv4(),
      _username: username,
      _password: hashedPassword,
      _email: email,
      _description: 'Administrador del sistema',
      _rol: 'Admin',
      _proyectosDueño: [],
      _proyectosColaborador: []
    });
    
    console.log(' Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Username:', username);
    
    process.exit(0);
  } catch (err) {
    console.error(' Error creating admin:', err);
    process.exit(1);
  }
}

createAdmin();

