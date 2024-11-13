const jwt = require('jsonwebtoken')

const JWT_SECRET = 'CLAVE'

const verifyToken = (req, res, next) =>{
    const token = req.headers['authorization']

    if(!token){
        return res.status(403).json({ message: 'Se requiere un token de autenticación'})
    }

    jwt.verify(token, JWT_SECRET, (err,decoded)=>{
        if(err){
            return res.status(401).json({ message: 'Token no válido o expirado'})
        }
        req.user =decoded
        next()
    })
}

const verifyAdmin = (req, res, next)=>{
    if  (req.user.rol !== 'administrador'){
        return res.status(403).json({message: 'Acceso denegado: Solo administradores pueden realizar esta acción.'})
    }
    next()
}

module.exports= { verifyToken, verifyAdmin }