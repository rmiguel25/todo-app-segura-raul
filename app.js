// Importar los módulos necesarios
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const path = require('path');

const app = express();

// Añadir cabeceras de seguridad con helmet
app.use(helmet());

// Middleware para parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configurar sesiones de usuario (en memoria para la demo)
app.use(session({
    secret: 'secret-key-segura',         // Cambia este valor en producción
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false } // Usa 'secure: true' si tienes HTTPS
}));

// Servir archivos estáticos de la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Objeto para guardar las tareas de cada usuario (en memoria, solo para demo)
const tasks = {}; // { sessionID: [ {id, text} ] }

// "Login" muy básico: cualquier usuario puede iniciar sesión como demo
app.post('/login', (req, res) => {
    req.session.user = 'demo';
    // Inicializar el array de tareas para la sesión si no existe
    if (!tasks[req.session.id]) tasks[req.session.id] = [];
    res.json({ ok: true });
});

// Logout: destruye la sesión del usuario
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// Obtener las tareas del usuario logueado
app.get('/api/tasks', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'No autorizado' });
    res.json(tasks[req.session.id] || []);
});

// Añadir una nueva tarea a la lista
app.post('/api/tasks', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'No autorizado' });
    const { text } = req.body;
    // Validar la entrada del usuario (evita XSS y errores)
    if (!text || typeof text !== 'string' || text.length > 100) {
        return res.status(400).json({ error: 'Texto inválido' });
    }
    // Sanitizar el texto para evitar scripts (XSS)
    const safeText = text.replace(/[<>&'"]/g, c => (
        { '<':'&lt;','>':'&gt;','&':'&amp;',"'":'&#39;','"':'&quot;' }[c]
    ));
    const task = { id: Date.now(), text: safeText };
    tasks[req.session.id].push(task);
    res.json(task);
});

// Eliminar una tarea por ID
app.delete('/api/tasks/:id', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'No autorizado' });
    tasks[req.session.id] = (tasks[req.session.id] || []).filter(task => task.id != req.params.id);
    res.json({ ok: true });
});

// Iniciar el servidor en el puerto 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`App segura en http://localhost:${PORT}`));

