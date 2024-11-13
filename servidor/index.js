const express =require('express')
const cors =require("cors")
const db =require('./database')
const bodyParser= require('body-parser')
const { registerUser, getAllUsers } = require('./database')

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

const { readJSON, writeJSON } = require('./db')

app.get('/test-persistencia', (req, res) => {
    const usuarios = readJSON('usuarios.json')
    res.json(usuarios)
})

app.post('/register', (req, res) => {
    const { nombre, email, contraseña, rol } = req.body;
    registerUser(nombre, email, contraseña, rol, (err, userId) => {
        if (err) {
            return res.status(500).json({ error: 'Error registrando usuario.' });
        }
        res.status(201).json({ id: userId, message: 'Usuario registrado exitosamente.' });
    });
});

app.get('/usuarios', (req, res) => {
    getAllUsers((err, usuarios) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo usuarios.' });
        }
        res.status(200).json(usuarios);
    });
});

app.post('/add-product', (req, res) => {
    const { nombre, descripcion, precio, cantidad } = req.body;
    const query = `INSERT INTO productos (nombre, descripcion, precio, cantidad) 
                   VALUES (?, ?, ?, ?)`;
    db.run(query, [nombre, descripcion, precio, cantidad], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Producto agregado exitosamente', id: this.lastID });
    });
});

app.post('/comprar', (req, res) => {
    const { usuario_id, productos } = req.body;

    if (!usuario_id || !productos || productos.length === 0) {
        return res.status(400).json({ message: 'Faltan datos para realizar la compra' });
    }

    // Calcular el total de la compra
    let total = 0;
    productos.forEach(producto => {
        total += producto.precio * producto.cantidad;
    });

    // Insertar la compra en la base de datos
    const query = `INSERT INTO compras (usuario_id, productos, total) VALUES (?, ?, ?)`;
    db.run(query, [usuario_id, JSON.stringify(productos), total], function (err) {
        if (err) {
            console.error('Error al registrar la compra:', err.message);
            return res.status(500).json({ message: 'Error al registrar la compra' });
        }

        res.status(201).json({
            message: 'Compra realizada exitosamente',
            compra_id: this.lastID,
            total: total
        });
    });
});

app.get('/compras/:usuario_id', (req, res) => {
    const { usuario_id } = req.params;
    db.all('SELECT * FROM compras WHERE usuario_id = ?', [usuario_id], (err, rows) => {
        if (err) {
            console.error('Error al obtener las compras:', err.message);
            return res.status(500).json({ message: 'Error al obtener las compras' });
        }
        res.json(rows);
    });
});

const bcrypt= require('bcrypt')
const jwt = require('jsonwebtoken')

const JWT_SECRET = 'clave'

app.post('/registro', async(req, res)=>{
    const {nombre,email, contrasena,rol}=req.body

    if(!nombre || !email || !contrasena || !rol){
        return res.status(400).json({message: 'Todos los campos son requeridos'})
    }

    try{
        const hashedPassword = await bcrypt.hash(contrasena,10)

        const query = `INSERT INTO usuarios (nombre, email, contrasena, rol) VALUES (?, ?, ?, ?)`
        db.run(query, [nombre, email, hashedPassword,rol], function(err){
            if(err){
                console.error('Error al registrar el usuario:', err.message)
                return res.status(500).json({ message: 'Error al registrar el usuario' })
            }
            res.status(201).json({ message: 'Usuario registrado exitosamente', usuario_id: this.lastID})
        })
    }
    catch(err){
        console.error('Error encriptando la contraseña:', err.message);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
}) 

const {verifyToken, verifyAdmin} = require('./authMiddleware')

app.get('/perfil', verifyToken, (req,res)=>{
    res.json({message: 'Acceso concedido a tu perfil', usuario: req.user})
})

app.post('/productos', verifyToken, verifyAdmin, (req, res) => {
    const { nombre, descripcion, precio, cantidad } = req.body;

    const query = `INSERT INTO productos (nombre, descripcion, precio, cantidad) VALUES (?, ?, ?, ?)`;
    db.run(query, [nombre, descripcion, precio, cantidad], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error al agregar producto', error: err.message });
        }
        res.status(201).json({ message: 'Producto agregado exitosamente', productId: this.lastID });
    });
});

app.get('/productos', verifyToken, (req, res) => {
    const query = `SELECT * FROM productos`;
    db.all(query, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error al obtener productos', error: err.message });
        }
        res.json(rows);
    });
});

app.post('/compras', verifyToken, (req, res) => {
    const { productos } = req.body;
    res.status(201).json({ message: 'Compra realizada exitosamente' });
});

app.get('/productos', (req,res)=>{
    const query = `SELECT * FROM productos`

    db.all(query, [], (err, rows)=>{
        if (err) {
            return res.status(500).json({ message: 'Error al obtener productos', error: err.message });
        }
        res.json(rows);
    })
})

app.put('/productos/:id', verifyToken, verifyAdmin, (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, cantidad } = req.body;

    const query = `UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, cantidad = ? WHERE id = ?`;
    db.run(query, [nombre, descripcion, precio, cantidad, id], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error al actualizar producto', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.json({ message: 'Producto actualizado exitosamente' });
    });
});

app.delete('/productos/:id', verifyToken, verifyAdmin, (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM productos WHERE id = ?`;
    db.run(query, id, function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error al eliminar producto', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.json({ message: 'Producto eliminado exitosamente' });
    });
});

app.post('/carrito', verifyToken, (req, res) => {
    const { idProducto, cantidad } = req.body;

    const query = `SELECT * FROM productos WHERE id = ? AND cantidad >= ?`;
    db.get(query, [idProducto, cantidad], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Error al validar producto', error: err.message });
        }
        if (!row) {
            return res.status(400).json({ message: 'Producto no disponible en la cantidad solicitada' });
        }
        res.json({ message: 'Producto disponible', producto: row });
    });
});

app.post('/compras', verifyToken, (req, res) => {
    const { productos } = req.body; // productos es un array de { idProducto, cantidad }
    const userId = req.user.id; // ID del usuario autenticado
    let totalCompra = 0;
    const detallesCompra = [];

    db.serialize(() => {
        // Iniciar transacción para consistencia
        db.run("BEGIN TRANSACTION");

        productos.forEach(({ idProducto, cantidad }) => {
            db.get(`SELECT * FROM productos WHERE id = ?`, [idProducto], (err, producto) => {
                if (err || !producto || producto.cantidad < cantidad) {
                    db.run("ROLLBACK"); // Deshacer cambios si hay error
                    return res.status(400).json({ message: 'Error con el producto o cantidad no disponible' });
                }

                const precioUnitario = producto.precio;
                const totalProducto = precioUnitario * cantidad;
                totalCompra += totalProducto;
                detallesCompra.push({ idProducto, cantidad, precioUnitario, totalProducto });

                // Actualizar cantidad en inventario
                db.run(
                    `UPDATE productos SET cantidad = cantidad - ? WHERE id = ?`,
                    [cantidad, idProducto]
                );
            });
        });

        // Insertar compra en la base de datos
        db.run(
            `INSERT INTO compras (idUsuario, detalles, total) VALUES (?, ?, ?)`,
            [userId, JSON.stringify(detallesCompra), totalCompra],
            function (err) {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ message: 'Error al guardar la compra', error: err.message });
                }

                db.run("COMMIT"); // Confirmar transacción
                res.json({ message: 'Compra realizada exitosamente', idCompra: this.lastID });
            }
        );
    });
});


app.get('/compras', verifyToken, (req, res) => {
    const userId = req.user.id;

    db.all(`SELECT * FROM compras WHERE idUsuario = ?`, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error al obtener historial de compras', error: err.message });
        }
        res.json(rows);
    });
});

app.post("/compras", verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { items } = req.body; // Lista de productos en el carrito

    try {
        // Calcular el total de la compra
        const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

        // Crear la compra en la tabla de compras
        const compraResult = await db.run(
            `INSERT INTO compras (usuario_id, total) VALUES (?, ?)`,
            [userId, total]
        );

        const compraId = compraResult.lastID;

        // Registrar cada producto en la tabla de detalles de compra
        for (const item of items) {
            await db.run(
                `INSERT INTO detalles_compra (compra_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`,
                [compraId, item.id, item.quantity, item.price]
            );

            // Reducir la cantidad del inventario
            await db.run(
                `UPDATE productos SET cantidad = cantidad - ? WHERE id = ?`,
                [item.quantity, item.id]
            );
        }

        res.status(201).json({ message: "Compra realizada exitosamente", compraId });
    } catch (error) {
        console.error("Error al registrar la compra:", error);
        res.status(500).json({ message: "Error al procesar la compra" });
    }
});


const PDFDocument = require("pdfkit");
const fs = require("fs");

app.get("/compras/:id/factura", verifyToken, async (req, res) => {
    const compraId = req.params.id;
    const userId = req.user.id;

    try {
        // Obtener detalles de la compra y productos comprados
        const compra = await db.get(`SELECT * FROM compras WHERE id = ? AND usuario_id = ?`, [compraId, userId]);
        const productos = await db.all(`SELECT * FROM detalles_compra WHERE compra_id = ?`, [compraId]);

        if (!compra) {
            return res.status(404).json({ message: "Compra no encontrada" });
        }

        // Crear el PDF de la factura
        const doc = new PDFDocument();
        const filename = `factura_${compraId}.pdf`;

        // Configurar la respuesta para descargar el archivo
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Type", "application/pdf");

        doc.pipe(res);

        // Añadir información al PDF
        doc.fontSize(20).text("Factura de Compra", { align: "center" });
        doc.moveDown();
        doc.fontSize(14).text(`Compra ID: ${compraId}`);
        doc.text(`Fecha: ${new Date(compra.date).toLocaleDateString()}`);
        doc.text(`Total: $${compra.total.toFixed(2)}`);
        doc.moveDown();

        // Detalles de productos
        doc.fontSize(16).text("Detalles de Productos Comprados:");
        productos.forEach(item => {
            doc.fontSize(12).text(`- ${item.producto_id} | Cantidad: ${item.cantidad} | Precio Unitario: $${item.precio_unitario}`);
        });

        doc.end();

    } catch (error) {
        console.error("Error al generar la factura:", error);
        res.status(500).json({ message: "Error al generar la factura" });
    }
});