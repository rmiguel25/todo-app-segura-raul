const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// ¡NO USAMOS HELMET! (sin cabeceras de seguridad)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Sesión insegura: secreto débil y httpOnly desactivado
app.use(session({
    secret: '123', // Secreto predecible
    resave: true,
    saveUninitialized: true,
    cookie: { httpOnly: false, secure: false }
}));

// Servir archivos estáticos de la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Objeto global para guardar tareas (todas juntas, sin aislamiento)
const tasks = {}; // { sessionID: [ {id, text} ] }

// --- VULNERABILIDAD 1: Sin control de autenticación ---
// --- VULNERABILIDAD 2: Sin validación ni sanitización de XSS ---
// --- VULNERABILIDAD 3: Exposición de todas las tareas a cualquiera ---

// "Login" demo (realmente no lo necesitas, pero lo dejo por compatibilidad con el frontend)
app.post('/login', (req, res) => {
    req.session.user = 'demo';
    if (!tasks[req.session.id]) tasks[req.session.id] = [];
    res.json({ ok: true });
});

// Cerrar sesión (demo)
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// Obtener todas las tareas de todos los usuarios (fuga masiva de datos)
app.get('/api/tasks', (req, res) => {
    // ¡Ya no hay control de sesión!
    let todas = [];
    Object.values(tasks).forEach(arr => todas = todas.concat(arr));
    res.json(todas);
});

// Añadir tarea sin ningún control ni sanitización
app.post('/api/tasks', (req, res) => {
    const { text } = req.body;
    // Permite cualquier cosa, incluso <script>alert(1)</script>
    if (!tasks[req.session.id]) tasks[req.session.id] = [];
    const task = { id: Date.now(), text };
    tasks[req.session.id].push(task);
    res.json(task);
});

// Eliminar tarea de todos los usuarios (no seguro)
app.delete('/api/tasks/:id', (req, res) => {
    // Busca y borra la tarea en todas las sesiones (vulnerable)
    Object.values(tasks).forEach(arr => {
        const i = arr.findIndex(task => task.id == req.params.id);
        if (i !== -1) arr.splice(i, 1);
    });
    res.json({ ok: true });
});

// Escuchar en el puerto para Render/Heroku/etc.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`App VULNERABLE corriendo en http://localhost:${PORT}`));
