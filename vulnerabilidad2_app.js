const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();

// Sin Helmet (no hay cabeceras de seguridad)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Sesión insegura: secreto predecible y httpOnly desactivado
app.use(session({
    secret: '123',
    resave: true,
    saveUninitialized: true,
    cookie: { httpOnly: false, secure: false }
}));

// Servir archivos estáticos de la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Objeto global de tareas (sin aislamiento)
const tasks = {}; // { sessionID: [ {id, text} ] }

// --- VULNERABILIDAD: Path Traversal ---
app.get('/readfile', (req, res) => {
    const file = req.query.file;
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
            res.status(404).send('Archivo no encontrado o acceso denegado');
        } else {
            res.type('text/plain').send(data);
        }
    });
});

// "Login" demo (no real)
app.post('/login', (req, res) => {
    req.session.user = 'demo';
    if (!tasks[req.session.id]) tasks[req.session.id] = [];
    res.json({ ok: true });
});

// Logout demo
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// Obtener TODAS las tareas de TODOS los usuarios (fuga de información)
app.get('/api/tasks', (req, res) => {
    let todas = [];
    Object.values(tasks).forEach(arr => todas = todas.concat(arr));
    res.json(todas);
});

// Añadir tarea SIN sanitización ni control
app.post('/api/tasks', (req, res) => {
    const { text } = req.body;
    if (!tasks[req.session.id]) tasks[req.session.id] = [];
    const task = { id: Date.now(), text };
    tasks[req.session.id].push(task);
    res.json(task);
});

// Borrar tarea de cualquier usuario (sin control)
app.delete('/api/tasks/:id', (req, res) => {
    Object.values(tasks).forEach(arr => {
        const i = arr.findIndex(task => task.id == req.params.id);
        if (i !== -1) arr.splice(i, 1);
    });
    res.json({ ok: true });
});

// Escuchar en el puerto asignado por Render o localmente en 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`App VULNERABLE corriendo en http://localhost:${PORT}`));
