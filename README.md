# TaskFlow PWA

Proyecto PWA listo para cumplir con:

- Funcionamiento sin conexión mediante Service Worker.
- Manifest configurado.
- Iconos 192x192 y 512x512.
- Instalación como PWA.
- Notificaciones locales mediante Notification API + Service Worker.
- Persistencia de tareas con localStorage.
- Compatible con GitHub Pages.

## Probar localmente

No abras `index.html` directamente como archivo.

Puedes usar VS Code + Live Server o cualquier servidor HTTP local.

Ejemplo:

```bash
npx serve .
```

Luego abre la URL que indique el servidor.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub.
2. Sube todos los archivos de este proyecto a la raíz del repositorio.
3. En GitHub entra a **Settings > Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Selecciona la rama `main` y la carpeta `/ (root)`.
6. Guarda los cambios.
7. Espera a que GitHub Pages muestre la URL publicada.

Todos los enlaces del proyecto son relativos, por lo que funcionan correctamente dentro de una ruta tipo:

`https://usuario.github.io/nombre-repositorio/`

## Nota sobre notificaciones

El botón **Probar notificación** solicita permiso y muestra una notificación usando el Service Worker.

Esto demuestra que la PWA puede desplegar notificaciones sin necesitar un backend.

Para notificaciones push reales enviadas desde un servidor externo, se necesitaría un backend con Web Push/VAPID.
