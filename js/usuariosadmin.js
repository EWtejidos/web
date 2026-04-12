// Selecciona el formulario de usuarios desde el DOM (HTML)
// Este formulario es donde se crean nuevos usuarios
const userForm = document.querySelector('#userForm');

// Selecciona el cuerpo de la tabla donde se van a renderizar los usuarios
const usersTableBody = document.querySelector('#usersTableBody');

// Elemento donde se muestran mensajes de estado (éxito o error)
const userStatus = document.querySelector('#userStatus');


// Función asíncrona para obtener la lista de usuarios desde el backend
async function fetchUsers() {
  try {
    // Hace una petición GET al endpoint del backend (Flask según tu diagrama)
    const response = await fetch('/api/admin/users');

    // Si la respuesta no es correcta (status != 200-299), lanza un error
    if (!response.ok) {
      throw new Error('No se pudo cargar la lista de usuarios.');
    }

    // Convierte la respuesta a JSON (array de usuarios)
    const users = await response.json();

    // Inserta dinámicamente los usuarios en la tabla HTML
    // Usa map para recorrer cada usuario y generar filas <tr>
    usersTableBody.innerHTML = users.map((user) => `
      <tr>
        <td>${user.username}</td>  <!-- Muestra el nombre de usuario -->
        <td>${user.role}</td>      <!-- Muestra el rol del usuario -->
      </tr>
    `).join(''); // Une todo en un solo string
  } catch (error) {
    // Si ocurre cualquier error (red, servidor, etc.)

    // Muestra una fila indicando error en la tabla
    usersTableBody.innerHTML = '<tr><td colspan="2">Error cargando usuarios.</td></tr>';

    // Muestra el mensaje de error en el estado
    userStatus.textContent = error.message;

    // Aplica clase visual de error (probablemente CSS)
    userStatus.classList.add('is-error');
  }
}


// Función para crear un nuevo usuario (cuando se envía el formulario)
async function createUser(event) {

  // Previene el comportamiento por defecto del formulario (recargar página)
  event.preventDefault();

  // Limpia cualquier mensaje anterior
  userStatus.textContent = '';

  // Elimina clases de estado anteriores (error o éxito)
  userStatus.classList.remove('is-error', 'is-success');

  // Obtiene los datos del formulario (input fields)
  const formData = new FormData(userForm);

  // Convierte los datos en formato URL (clave=valor)
  // Esto es lo que espera típicamente Flask si no usas JSON
  const payload = new URLSearchParams(formData);

  // Envía los datos al backend con método POST
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    body: payload,
  });

  // Convierte la respuesta del servidor a JSON
  const result = await response.json();

  // Si el servidor responde con error
  if (!response.ok) {
    // Muestra el error devuelto por backend o uno genérico
    userStatus.textContent = result.error || 'Error creando el usuario.';

    // Aplica estilo visual de error
    userStatus.classList.add('is-error');

    return; // Detiene la ejecución
  }

  // Si todo sale bien, muestra mensaje de éxito
  userStatus.textContent = `Usuario ${result.username} creado con rol ${result.role}.`;

  // Aplica estilo visual de éxito
  userStatus.classList.add('is-success');

  // Limpia el formulario
  userForm.reset();

  // Vuelve a cargar la lista de usuarios para reflejar el nuevo usuario creado
  fetchUsers();
}


// Verifica que el formulario exista en la página antes de usarlo
if (userForm) {

  // Escucha el evento submit (cuando el usuario envía el formulario)
  userForm.addEventListener('submit', createUser);

  // Carga la lista de usuarios automáticamente al iniciar
  fetchUsers();
}
