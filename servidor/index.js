const express =require('express')
const cors =require("cors")
const db =require('./database')
const bodyParser= require('body-parser')
const { registerUser, getAllUsers } = require('./database')
const bycrypt =require('bcrypt')
const jwt = require('jsonwebtoken')
const { verifyToken, verifyAdmin } = require('./authMiddleware');
const { readJSON, writeJSON } = require('./db')
const bcrypt= require('bcrypt')
const initializeAdmin = require('./utils/initializeAdmin')
const app=express();
const PORT=3000;

const path = require('path')

app.use(express.static(path.join(__dirname, '../cliente')));

app.use(cors());
app.use(express.json());
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }));

initializeAdmin(db.db);

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname, '../cliente/views/index.html'));
})

app.get('/adminHome',(req,res)=>{
    res.sendFile(path.join(__dirname, '../cliente/views/adminHome.html'));
})

app.get('/productosCliente',(req,res)=>{
    res.sendFile(path.join(__dirname, '../cliente/views/productosCliente.html'));
})

app.get('/carritoCliente',(req,res)=>{
    res.sendFile(path.join(__dirname, '../cliente/views/carritoCliente.html'));
})

app.get('/historialCompras',(req,res)=>{
    res.sendFile(path.join(__dirname, '../cliente/views/historialCompras.html'));
})

app.get('/realizarCompra',(req,res)=>{
    res.sendFile(path.join(__dirname, '../cliente/views/realizarCompra.html'));
})

app.get('/clienteHome',(req,res)=>{
    res.sendFile(path.join(__dirname, '../cliente/views/clienteHome.html'));
})

app.get('/logout',(req,res)=>{
    res.sendFile(path.join(__dirname, '../cliente/views/index.html'));
})

app.get('/register',(req,res)=>{
    res.sendFile(path.join(__dirname,'../cliente/views/register.html' ))
})

app.get('/admin_productos',(req,res)=>{
    res.sendFile(path.join(__dirname, '../cliente/views/gestionProductos.html'));
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

console.log('DB:', db);  // Esto debería mostrar un objeto si `db` está correctamente definido


app.post('/registro', async (req, res) => {
    const { nombre, email, contrasena } = req.body;
    const rol = req.body.rol || 'cliente';  // Asigna "cliente" como valor predeterminado para rol

    if (!nombre || !email || !contrasena) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    try {
        // Función para verificar si el correo ya existe en la base de datos
        const verificarCorreo = () => {
            return new Promise((resolve, reject) => {
                const checkQuery = `SELECT email FROM usuarios WHERE email = ?`;
                db.db.get(checkQuery, [email], (err, row) => {
                    if (err) {
                        console.error('Error verificando el correo:', err.message);
                        reject(new Error('Error al verificar el correo'));
                    } else if (row) {
                        reject(new Error('El correo ya está registrado'));
                    } 
                });
            });
        };

        // Espera la verificación antes de proceder
        await verificarCorreo();

        // Si el correo no existe, procede con el registro
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const query = `INSERT INTO usuarios (nombre, email, contrasena, rol) VALUES (?, ?, ?, ?)`;
        
        db.db.run(query, [nombre, email, hashedPassword, rol], function (err) {
            if (err) {
                console.error('Error al registrar el usuario:', err.message);
                return res.status(500).json({ message: 'Error al registrar el usuario' });
            }
            res.status(201).json({ message: 'Usuario registrado exitosamente', usuario_id: this.lastID });
        });

    } catch (err) {
        // Envía una respuesta con el mensaje del error, ya sea por correo duplicado o error de conexión
        res.status(400).json({ message: err.message });
    }
});


// Define un secreto para tu JWT
const JWT_SECRET = 'tu-secreto-aqui'; // Asegúrate de usar un secreto fuerte y único

function generateJWT(user) {
    // Incluye los datos del usuario que quieras en el payload
    const payload = { id: user.id, email: user.email, rol: user.rol };
    const options = { expiresIn: '1h' }; // El token expirará en 1 hora

    // Genera el JWT
    return jwt.sign(payload, JWT_SECRET, options);
}


app.post('/login', (req, res) => {
    const { email, contrasena, rol } = req.body;

    if (!rol || (rol !== 'cliente' && rol !== 'admin')) {
        return res.status(400).json({ message: 'Rol inválido' });
    }

    const query = `SELECT * FROM usuarios WHERE email = ? AND rol = ?`;
    db.db.get(query, [email, rol], async (err, row) => {
        if (err) {
            console.error('Error al obtener el usuario:', err.message);
            return res.status(500).json({ message: 'Error al obtener el usuario' });
        }

        if (!row) {
            return res.status(400).json({ message: 'Usuario no encontrado o rol incorrecto' });
        }

        try {
            const passwordMatch = await bcrypt.compare(contrasena, row.contrasena);
            if (!passwordMatch) {
                return res.status(400).json({ message: 'Contraseña incorrecta' });
            }

            const token = generateJWT(row);
            res.json({ message: 'Inicio de sesión exitoso', token });
        } catch (error) {
            console.error('Error al comparar la contraseña:', error.message);
            res.status(500).json({ message: 'Error al comparar la contraseña' });
        }
    });
});



app.get('/productos', (req, res) => {
    const query = `SELECT * FROM productos`;
    db.db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error al obtener los productos:", err.message);
            return res.status(500).json({ message: 'Error al obtener productos' });
        }
        res.status(200).json(rows);
    });
});

app.post('/productos', (req, res) => {
    console.log('Datos recibidos en req.body:', req.body);
    const { nombre, descripcion, precio, cantidad } = req.body;
    if (!nombre || !precio || !cantidad) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const query = `INSERT INTO productos (nombre, descripcion, precio, cantidad) VALUES (?, ?, ?, ?)`;
    db.db.run(query, [nombre, descripcion, precio, cantidad], function (err) {
        if (err) {
            console.error('Error al agregar el producto:', err.message);
            return res.status(500).json({ message: 'Error al agregar el producto' });
        }
        res.status(201).json({ message: 'Producto agregado exitosamente', producto_id: this.lastID });
    });
});

app.put('/productos/:id', (req, res)=>{
    const { id } = req.params
    const { nombre, descripcion, precio, cantidad} = req.body
    const query = 'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, cantidad = ?'
    db.db.run(query, [nombre,descripcion,precio,cantidad],function(err){
        if(err){
            return res.status(500).json({error: 'Error al actualizar producto'})
        }
        res.json({ message: 'Producto Actualizado'})
    })
})

app.delete('productos/:id',(req,res)=>{
    const { id } = req.params
    const query = 'DELETE FROM productos WHERE id = ?'
    db.db.run(query, [id], function(err){
        if(err){
            return res.status(500).json({ error: 'Error al eliminar producto'})
        }
        res.json({ message: 'Producto eliminado'})
    })
})

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

app.get('/admin', authMiddleware, (req, res) => {
    if (req.user.rol !== 'administrador') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/perfil', authMiddleware, (req, res) => {
    if (req.user.rol !== 'cliente') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    res.sendFile(path.join(__dirname, 'views', 'perfil.html'));
});

function authMiddleware(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Token inválido' });
    }
}





