const express =require('express')
const cors =require("cors")
const db =require('./database')
const bodyParser= require('body-parser')
const { registerUser, getAllUsers } = require('./database')
const bycrypt =require('bcrypt')
const jwt = require('jsonwebtoken')
const { verifyToken, verifyAdmin } = require('./authMiddleware');
const { readJSON, writeJSON } = require('./db')

const app=express();
const PORT=3000;

const path = require('path')

app.use(express.static(path.join(__dirname, '../cliente')));

app.use(cors());
app.use(express.json());
app.use(bodyParser.json())

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname, '../cliente/views/index.html'));
})

app.get('/carrito', (req, res) => {
    res.sendFile(path.join(__dirname, '../cliente/views/carrito.html'));
});

app.get('/perfil', (req, res) => {
    res.sendFile(path.join(__dirname, '../cliente/views/perfil.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../cliente/views/login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../cliente/views/admin.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, '../cliente/views/index.html'));
});

app.get('/', (req, res) => {
    res.redirect('/index');
});

app.listen(PORT, ()=>{
    console.log(`Servidor escuchando en http://localhost:${PORT}`)
})

app.post('/registro', async (req, res) => {
    const { nombre, email, contrasena, rol } = req.body;

    if (!nombre || !email || !contrasena || !rol) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    try {
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const query = `INSERT INTO usuarios (nombre, email, contrasena, rol) VALUES (?, ?, ?, ?)`;
        db.run(query, [nombre, email, hashedPassword, rol], function (err) {
            if (err) {
                console.error('Error al registrar el usuario:', err.message);
                return res.status(500).json({ message: 'Error al registrar el usuario' });
            }
            res.status(201).json({ message: 'Usuario registrado exitosamente', usuario_id: this.lastID });
        });
    } catch (err) {
        console.error('Error encriptando la contraseña:', err.message);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

app.post('/login', (req, res) => {
    const { email, contrasena } = req.body;

    const query = `SELECT * FROM usuarios WHERE email = ?`;
    db.get(query, [email], async (err, user) => {
        if (err || !user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const validPassword = await bcrypt.compare(contrasena, user.contrasena);
        if (!validPassword) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        const token = jwt.sign({ userId: user.id, rol: user.rol }, 'CLAVE', { expiresIn: '1h' });
        res.status(200).json({ token });
    });
});

app.get('/productos', (req, res) => {
    const query = `SELECT * FROM productos`;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error al obtener los productos:", err.message);
            return res.status(500).json({ message: 'Error al obtener productos' });
        }
        res.status(200).json(rows);
    });
});

app.post('/productos', verifyToken, verifyAdmin, (req, res) => {
    const { nombre, descripcion, precio, cantidad } = req.body;
    if (!nombre || !descripcion || !precio || !cantidad) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const query = `INSERT INTO productos (nombre, descripcion, precio, cantidad) VALUES (?, ?, ?, ?)`;
    db.run(query, [nombre, descripcion, precio, cantidad], function (err) {
        if (err) {
            console.error('Error al agregar el producto:', err.message);
            return res.status(500).json({ message: 'Error al agregar el producto' });
        }
        res.status(201).json({ message: 'Producto agregado exitosamente', producto_id: this.lastID });
    });
});

app.post('/compras', verifyToken, (req, res) => {
    const { productos, total } = req.body;
    const usuario_id = req.user.userId;

    if (!productos || total === undefined) {
        return res.status(400).json({ message: 'Productos y total son requeridos' });
    }

    const query = `INSERT INTO compras (usuario_id, productos, total) VALUES (?, ?, ?)`;
    db.run(query, [usuario_id, JSON.stringify(productos), total], function (err) {
        if (err) {
            console.error('Error al realizar la compra:', err.message);
            return res.status(500).json({ message: 'Error al realizar la compra' });
        }

        // Actualizar el inventario de productos
        productos.forEach(producto => {
            const updateQuery = `UPDATE productos SET cantidad = cantidad - ? WHERE id = ?`;
            db.run(updateQuery, [producto.cantidad, producto.id], (err) => {
                if (err) {
                    console.error('Error al actualizar inventario:', err.message);
                }
            });
        });

        res.status(201).json({ message: 'Compra realizada con éxito', compra_id: this.lastID });
    });
});

app.get('/compras', verifyToken, (req, res) => {
    const usuario_id = req.user.userId;
    const query = `SELECT * FROM compras WHERE usuario_id = ?`;
    db.all(query, [usuario_id], (err, rows) => {
        if (err) {
            console.error("Error al obtener historial de compras:", err.message);
            return res.status(500).json({ message: 'Error al obtener historial de compras' });
        }
        res.status(200).json(rows);
    });
});




