
const CACHE_NAME = 'taskflow-v6';

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];


// =====================================
// INSTALACIÓN
// =====================================

self.addEventListener('install', event => {

  console.log('Instalando Service Worker...');

  event.waitUntil(

    caches.open(CACHE_NAME)

      .then(cache => {

        return cache.addAll(APP_SHELL);

      })

      .then(() => {

        console.log('Archivos almacenados en caché');

        return self.skipWaiting();

      })

  );

});


// =====================================
// ACTIVACIÓN
// =====================================

self.addEventListener('activate', event => {

  console.log('Service Worker activado');

  event.waitUntil(

    Promise.all([

      caches.keys().then(keys => {

        return Promise.all(

          keys
            .filter(key =>
              key.startsWith('taskflow-') &&
              key !== CACHE_NAME
            )
            .map(key => caches.delete(key))

        );

      }),

      self.clients.claim()

    ])

  );

});


// =====================================
// FUNCIONAMIENTO OFFLINE
// =====================================

self.addEventListener('fetch', event => {

  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Solo manejar archivos del mismo origen.
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(

    fetch(event.request)

      .then(response => {

        if (response.ok) {

          const copia = response.clone();

          event.waitUntil(

            caches.open(CACHE_NAME)

              .then(cache => {

                return cache.put(
                  event.request,
                  copia
                );

              })

          );

        }

        return response;

      })

      .catch(async () => {

        console.log(
          'Sin conexión, buscando archivo en caché'
        );

        const cachedResponse =
          await caches.match(event.request);

        if (cachedResponse) {

          return cachedResponse;

        }

        if (event.request.mode === 'navigate') {

          const paginaPrincipal =
            await caches.match('./index.html');

          if (paginaPrincipal) {
            return paginaPrincipal;
          }

        }

        return Response.error();

      })

  );

});


// =====================================
// CLIC EN NOTIFICACIÓN
// =====================================

self.addEventListener('notificationclick', event => {

  console.log('Notificación presionada');

  event.notification.close();

  const destino =
    new URL('./', self.registration.scope).href;

  event.waitUntil(

    clients.matchAll({

      type: 'window',

      includeUncontrolled: true

    }).then(async windowClients => {

      for (const client of windowClients) {

        if (client.url.startsWith(destino)) {

          return client.focus();

        }

      }

      if (clients.openWindow) {

        return clients.openWindow(destino);

      }

    })

  );

});
