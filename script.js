// Referencias a los elementos del DOM
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');

// Función para iniciar sesión (solo demo)
loginBtn.onclick = async () => {
    await fetch('/login', { method: 'POST' });
    loginBtn.style.display = 'none';
    logoutBtn.style.display = '';
    todoForm.style.display = '';
    cargarTareas();
};

// Función para cerrar sesión
logoutBtn.onclick = async () => {
    await fetch('/logout');
    loginBtn.style.display = '';
    logoutBtn.style.display = 'none';
    todoForm.style.display = 'none';
    todoList.innerHTML = '';
};

// Evento para enviar el formulario y añadir una tarea
todoForm.onsubmit = async (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;
    await fetch('/api/tasks', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ text })
    });
    todoInput.value = '';
    cargarTareas();
};

// Cargar las tareas desde el backend y mostrarlas
async function cargarTareas() {
    const res = await fetch('/api/tasks');
    if (!res.ok) return;
    const tasks = await res.json();
    todoList.innerHTML = '';
    for (let task of tasks) {
        const li = document.createElement('li');
        li.textContent = task.text;
        const btn = document.createElement('button');
        btn.textContent = 'Borrar';
        btn.onclick = async () => {
            await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
            cargarTareas();
        };
        li.appendChild(btn);
        todoList.appendChild(li);
    }
}