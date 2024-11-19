const bcrypt = require('bcrypt');

async function initializeAdmin(db) {
    const nombre = 'admin'
    const emailAdmin = 'admin@example.com';
    const passwordAdmin = 'admin123'; 
    const hashedPassword = await bcrypt.hash(passwordAdmin, 10);

    const query = `
        SELECT COUNT(*) AS count FROM usuarios WHERE rol = 'administrador'
    `;
    db.get(query, [], (err, row) => {
        if (err) {
            console.error('Error al verificar el administrador:', err);
            return;
        }
        if (row.count === 0) {
            const insertQuery = `
                INSERT INTO usuarios (nombre , email, contrasena, rol)
                VALUES (?, ?, ?, 'admin')
            `;
            db.run(insertQuery, [nombre, emailAdmin, hashedPassword], (err) => {
                if (err) {
                    console.error('Error al crear el administrador:', err);
                } else {
                    console.log('Administrador inicial creado con éxito.');
                }
            });
        } else {
            console.log('Administrador ya existente.');
        }
    });
}

module.exports = initializeAdmin;
