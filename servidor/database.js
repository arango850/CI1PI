const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt')

const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});


db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        contrasena TEXT NOT NULL,
        rol TEXT NOT NULL CHECK(rol IN ('admin', 'cliente'))
    )`, (err) => {
        if (err) {
            console.error("Error creando la tabla usuarios:", err.message);
        } else {
            console.log("Tabla usuarios verificada o creada.");
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        descripcion TEXT,
        precio REAL,
        cantidad INTEGER
    )`, (err) => {
        if (err) {
            console.error("Error creando la tabla productos:", err.message);
        } else {
            console.log("Tabla productos verificada o creada.");
        }
    });

    db.all(`SELECT * FROM productos`, (err, rows) => {
        if (err) {
            console.error("Error al hacer SELECT en productos:", err.message);
        } else {
            console.log("Consulta de prueba en productos exitosa:", rows);
        }
    });
    db.run(`CREATE TABLE IF NOT EXISTS compras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        productos TEXT,  -- Almacenaremos los productos comprados como un string JSON
        total REAL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )`, (err) => {
        if (err) {
            console.error("Error creando la tabla compras:", err.message);
        } else {
            console.log("Tabla compras verificada o creada.");
        }
    });
});

function registerUser(nombre,email,constrasena,rol,callback){
    const hashedPassword = bcrypt.hashSync(constrasena,10)

    db.run(`INSERT INTO usuarios (nombre, email, contrasena, rol) VALUES (?, ?, ?, ?)`, 
    [nombre, email, hashedPassword, rol], 
    function(err) {
        if (err) {
            console.error("Error registrando el usuario:", err.message);
            callback(err);
        } else {
            console.log(`Usuario registrado con ID: ${this.lastID}`);
            callback(null, this.lastID);
        }
    });
}

function getAllUsers(callback) {
    db.all(`SELECT * FROM usuarios`, [], (err, rows) => {
        if (err) {
            console.error("Error al obtener usuarios:", err.message);
            callback(err, null);
        } else {
            callback(null, rows);
        }
    });
}

module.exports = {db, registerUser,getAllUsers};
