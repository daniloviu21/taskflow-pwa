const STORAGE_KEY = 'taskflow_tasks_v1';

const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const taskSummary = document.getElementById('taskSummary');
const notificationBtn = document.getElementById('notificationBtn');
const networkBadge = document.getElementById('networkBadge');
const installBtn = document.getElementById('installBtn');
const filterButtons = [...document.querySelectorAll('.filter')];

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let currentFilter = 'all';
let deferredPrompt = null;

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDate(dateString) {
  if (!dateString) return 'Sin fecha';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

function renderTasks() {
  const visibleTasks = tasks.filter(task => {
    if (currentFilter === 'pending') return !task.done;
    if (currentFilter === 'done') return task.done;
    return true;
  });

  taskList.innerHTML = '';

  visibleTasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${task.done ? 'done' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-check';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', `Marcar ${task.title} como completada`);
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const info = document.createElement('div');
    const title = document.createElement('p');
    title.className = 'task-title';
    title.textContent = task.title;

    const meta = document.createElement('p');
    meta.className = 'task-meta';
    meta.textContent = `${task.subject} · Entrega: ${formatDate(task.dueDate)}`;

    info.append(title, meta);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'icon-btn';
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    li.append(checkbox, info, deleteBtn);
    taskList.appendChild(li);
  });

  const pending = tasks.filter(task => !task.done).length;
  taskSummary.textContent = `${tasks.length} tarea${tasks.length === 1 ? '' : 's'} · ${pending} pendiente${pending === 1 ? '' : 's'}`;

  emptyState.hidden = visibleTasks.length !== 0;
}

async function toggleTask(id) {

  const tarea = tasks.find(task => task.id === id);

  if (!tarea) return;

  // Cambiar el estado
  tarea.done = !tarea.done;

  // Guardar
  saveTasks();

  // Si acaba de completarse, mandar notificación
  if (tarea.done) {

    console.log('Tarea completada:', tarea.title);

    try {

      const registration =
        await navigator.serviceWorker.ready;

      await registration.showNotification(
        '🎉 ¡Tarea completada!',
        {
          body: `Terminaste: ${tarea.title}`,
          icon: './icons/icon-192.png',
          badge: './icons/icon-192.png',
          tag: `tarea-${tarea.id}`
        }
      );

      console.log('Notificación enviada');

    } catch (error) {

      console.error(
        'Error mostrando notificación:',
        error
      );
    }
  }

  // Renderizar DESPUÉS
  renderTasks();
}

async function mostrarNotificacionTarea(tarea) {

  // Verificar soporte
  if (!('Notification' in window)) {
    console.log('El navegador no soporta notificaciones');
    return;
  }

  // Solicitar permiso si todavía no se ha solicitado
  if (Notification.permission === 'default') {

    const permiso = await Notification.requestPermission();

    if (permiso !== 'granted') {
      return;
    }
  }

  // Si el usuario bloqueó las notificaciones
  if (Notification.permission !== 'granted') {
    console.log('No hay permiso para notificaciones');
    return;
  }

  try {

    // Esperar al Service Worker
    const registration =
      await navigator.serviceWorker.ready;

    // Mostrar notificación
    await registration.showNotification(
      '🎉 ¡Tarea completada!',
      {
        body: `Terminaste: ${tarea.title}`,
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        tag: `tarea-${tarea.id}`
      }
    );

  } catch (error) {

    console.error(
      'Error mostrando notificación:',
      error
    );
  }
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
}

taskForm.addEventListener('submit', event => {
  event.preventDefault();

  const title = document.getElementById('title').value.trim();
  const subject = document.getElementById('subject').value.trim();
  const dueDate = document.getElementById('dueDate').value;

  if (!title || !subject || !dueDate) return;

  tasks.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title,
    subject,
    dueDate,
    done: false,
    createdAt: Date.now()
  });

  saveTasks();
  renderTasks();
  taskForm.reset();
});

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    renderTasks();
  });
});

function updateNetworkStatus() {
  const online = navigator.onLine;
  networkBadge.textContent = online ? '● En línea' : '● Sin conexión';
  networkBadge.title = online
    ? 'La aplicación tiene conexión a Internet'
    : 'La aplicación sigue funcionando con recursos almacenados en caché';
}

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
updateNetworkStatus();

notificationBtn.addEventListener('click', async () => {
  if (!('Notification' in window)) {
    alert('Este navegador no soporta notificaciones.');
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    alert('No se concedió permiso para mostrar notificaciones.');
    return;
  }

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('TaskFlow', {
      body: 'Notificación de prueba: tu PWA puede desplegar notificaciones.',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: 'taskflow-demo',
      data: { url: './' }
    });
  } else {
    new Notification('TaskFlow', {
      body: 'Notificación de prueba: tu PWA puede desplegar notificaciones.'
    });
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker registrado:', registration.scope);
    } catch (error) {
      console.error('No se pudo registrar el Service Worker:', error);
    }
  });
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

window.addEventListener('appinstalled', () => {
  installBtn.hidden = true;
  deferredPrompt = null;
});

renderTasks();
