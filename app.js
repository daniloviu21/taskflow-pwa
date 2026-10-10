
const STORAGE_KEY = 'taskflow_tasks_v1';

// =====================================
// ELEMENTOS DEL DOM
// =====================================

const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const taskSummary = document.getElementById('taskSummary');
const networkBadge = document.getElementById('networkBadge');
const installBtn = document.getElementById('installBtn');

const filterButtons = [
  ...document.querySelectorAll('.filter')
];

// =====================================
// VARIABLES
// =====================================

let tasks = JSON.parse(
  localStorage.getItem(STORAGE_KEY) || '[]'
);

let currentFilter = 'all';
let deferredPrompt = null;


// =====================================
// GUARDAR TAREAS
// =====================================

function saveTasks() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(tasks)
  );

}


// =====================================
// FORMATO DE FECHA
// =====================================

function formatDate(dateString) {

  if (!dateString) return 'Sin fecha';

  const [year, month, day] = dateString.split('-');

  return `${day}/${month}/${year}`;

}


// =====================================
// MOSTRAR TAREAS
// =====================================

function renderTasks() {

  const visibleTasks = tasks.filter(task => {

    if (currentFilter === 'pending') {
      return !task.done;
    }

    if (currentFilter === 'done') {
      return task.done;
    }

    return true;

  });

  taskList.innerHTML = '';

  visibleTasks.forEach(task => {

    const li = document.createElement('li');

    li.className = `task-item ${task.done ? 'done' : ''}`;

    // Checkbox
    const checkbox = document.createElement('input');

    checkbox.type = 'checkbox';
    checkbox.className = 'task-check';
    checkbox.checked = task.done;

    checkbox.setAttribute(
      'aria-label',
      `Marcar ${task.title} como completada`
    );

    // Evento para completar tarea
    checkbox.addEventListener('change', () => {

      toggleTask(task.id);

    });

    // Información
    const info = document.createElement('div');

    const title = document.createElement('p');

    title.className = 'task-title';
    title.textContent = task.title;

    const meta = document.createElement('p');

    meta.className = 'task-meta';

    meta.textContent =
      `${task.subject} · Entrega: ${formatDate(task.dueDate)}`;

    info.append(title, meta);

    // Eliminar
    const deleteBtn = document.createElement('button');

    deleteBtn.type = 'button';
    deleteBtn.className = 'icon-btn';
    deleteBtn.textContent = 'Eliminar';

    deleteBtn.addEventListener('click', () => {
      deleteTask(task.id);
    });

    li.append(
      checkbox,
      info,
      deleteBtn
    );

    taskList.appendChild(li);

  });

  const pending = tasks.filter(
    task => !task.done
  ).length;

  taskSummary.textContent =
    `${tasks.length} tarea${tasks.length === 1 ? '' : 's'} · ` +
    `${pending} pendiente${pending === 1 ? '' : 's'}`;

  emptyState.hidden = visibleTasks.length !== 0;

}


// =====================================
// COMPLETAR TAREA
// =====================================

function toggleTask(id) {

  const tarea = tasks.find(
    task => task.id === id
  );

  if (!tarea) {
    console.error('Tarea no encontrada');
    return;
  }

  const estabaCompletada = tarea.done;

  // Cambiar estado
  tarea.done = !tarea.done;

  console.log(
    'Tarea:',
    tarea.title,
    'Completada:',
    tarea.done
  );

  // Guardar cambios
  saveTasks();

  // Actualizar interfaz
  renderTasks();

  // SOLO NOTIFICAR CUANDO SE COMPLETA
  if (!estabaCompletada && tarea.done) {

    console.log(
      '🔔 Tarea completada, generando notificación...'
    );

    // Ejecutamos inmediatamente desde el evento
    // del checkbox para conservar la activación
    // del usuario al solicitar permisos.
    mostrarNotificacionTarea(tarea);

  }

}


// =====================================
// NOTIFICACIÓN AUTOMÁTICA
// =====================================

async function mostrarNotificacionTarea(tarea) {

  if (!('Notification' in window)) {

    console.error(
      'Este navegador no soporta notificaciones'
    );

    return;

  }

  if (!('serviceWorker' in navigator)) {

    console.error(
      'Service Worker no soportado'
    );

    return;

  }

  try {

    // Solicitar permiso desde la interacción
    // del usuario si todavía no existe.
    let permiso = Notification.permission;

    if (permiso === 'default') {

      permiso = await Notification.requestPermission();

    }

    console.log(
      'Permiso de notificaciones:',
      permiso
    );

    if (permiso !== 'granted') {

      console.warn(
        'No se permitió mostrar notificaciones'
      );

      return;

    }

    // Obtener Service Worker
    const registration =
      await navigator.serviceWorker.ready;

    console.log(
      'Service Worker listo:',
      registration.scope
    );

    // Mostrar notificación
    await registration.showNotification(
      '🎉 ¡Tarea completada!',
      {
        body: `Terminaste: ${tarea.title}`,

        icon: './icons/icon-192.png',

        badge: './icons/icon-192.png',

        tag: `tarea-${tarea.id}`,

        data: {
          url: './'
        }
      }
    );

    console.log(
      '✅ Notificación mostrada correctamente'
    );

  } catch (error) {

    console.error(
      '❌ Error al mostrar notificación:',
      error
    );

  }

}


// =====================================
// ELIMINAR TAREA
// =====================================

function deleteTask(id) {

  tasks = tasks.filter(
    task => task.id !== id
  );

  saveTasks();

  renderTasks();

}


// =====================================
// AGREGAR TAREA
// =====================================

taskForm.addEventListener('submit', event => {

  event.preventDefault();

  const title = document
    .getElementById('title')
    .value.trim();

  const subject = document
    .getElementById('subject')
    .value.trim();

  const dueDate = document
    .getElementById('dueDate')
    .value;

  if (!title || !subject || !dueDate) {
    return;
  }

  tasks.unshift({

    id: crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()),

    title: title,

    subject: subject,

    dueDate: dueDate,

    done: false,

    createdAt: Date.now()

  });

  saveTasks();

  renderTasks();

  taskForm.reset();

  console.log(
    'Nueva tarea creada:',
    title
  );

});


// =====================================
// FILTRAR TAREAS
// =====================================

filterButtons.forEach(button => {

  button.addEventListener('click', () => {

    currentFilter = button.dataset.filter;

    filterButtons.forEach(btn => {
      btn.classList.remove('active');
    });

    button.classList.add('active');

    renderTasks();

  });

});


// =====================================
// DETECTAR CONEXIÓN
// =====================================

function updateNetworkStatus() {

  const online = navigator.onLine;

  networkBadge.textContent = online
    ? '● En línea'
    : '● Sin conexión';

  networkBadge.title = online
    ? 'La aplicación tiene conexión a Internet'
    : 'La aplicación funciona con recursos en caché';

}

window.addEventListener(
  'online',
  updateNetworkStatus
);

window.addEventListener(
  'offline',
  updateNetworkStatus
);

updateNetworkStatus();


// =====================================
// REGISTRAR SERVICE WORKER
// =====================================

if ('serviceWorker' in navigator) {

  window.addEventListener('load', async () => {

    try {

      const registration =
        await navigator.serviceWorker.register('./sw.js', {
          updateViaCache: 'none'
        });

      console.log(
        '✅ Service Worker registrado:',
        registration.scope
      );

      // Comprobar actualizaciones
      await registration.update();

    } catch (error) {

      console.error(
        '❌ Error registrando Service Worker:',
        error
      );

    }

  });

}


// =====================================
// INSTALAR PWA
// =====================================

window.addEventListener(
  'beforeinstallprompt',
  event => {

    event.preventDefault();

    deferredPrompt = event;

    installBtn.hidden = false;

  }
);

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


// =====================================
// INICIALIZACIÓN
// =====================================

renderTasks();

console.log('✅ TaskFlow iniciado correctamente');
