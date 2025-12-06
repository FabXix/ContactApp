# Insertar Usuario Admin en MongoDB

## Opción 1: Usando MongoDB Shell (mongosh)

```bash
mongosh
```

Luego ejecuta:

```javascript
use tu_base_de_datos

db.users.insertOne({
  "_uuid": "fb727cc7-7131-403f-adfc-e03450d010a6",
  "_username": "admin",
  "_password": "$2b$10$f1iXCMwAIEbR9aV3/Kh/cO4tCIQtRc6sX.Hnq01kNKebkQX5UMXRu",
  "_email": "admin@gmail.com",
  "_description": "Administrador del sistema",
  "_rol": "Admin",
  "_proyectosDueño": [],
  "_proyectosColaborador": []
})
```

## Opción 2: Usando mongoimport

```bash
mongoimport --db tu_base_de_datos --collection users --file admin-user.json --jsonArray
```

## Opción 3: Usando MongoDB Compass

1. Abre MongoDB Compass
2. Conéctate a tu base de datos
3. Selecciona la colección `users`
4. Haz clic en "Insert Document"
5. Pega el contenido de `admin-user.json`
6. Haz clic en "Insert"

## Credenciales del Admin

- **Email:** admin@gmail.com
- **Password:** admin@123
- **Username:** admin
- **Rol:** Admin

