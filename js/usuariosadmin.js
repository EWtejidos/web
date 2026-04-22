// ========== SELECTORES DEL DOM ==========
const userForm = document.querySelector('#userForm');
const usersTableBody = document.querySelector('#usersTableBody');
const userStatus = document.querySelector('#userStatus');
const usersCount = document.querySelector('#usersCount');
const newUsernameInput = document.querySelector('#newUsername');
const newPasswordInput = document.querySelector('#newPassword');
const newRoleInput = document.querySelector('#newRole');

// ========== MAPEO DE ROLES A ICONOS ==========
const roleIcons = {
  tejedor: '🧵',
  transportista: '🚚',
  admin: '👨‍💼'
};

const roleLabels = {
  tejedor: 'Tejedor',
  transportista: 'Transportista',
  admin: 'Administrador'
};

// ========== CARGAR USUARIOS ==========
async function fetchUsers() {
  try {
    const response = await fetch('/api/admin/users');

    if (!response.ok) {
      throw new Error('No se pudo cargar la lista de usuarios.');
    }

    const users = await response.json();
    
    if (!Array.isArray(users) || users.length === 0) {
      usersTableBody.innerHTML = `
        <tr class="empty-state">
          <td colspan="3" class="empty-message">📭 No hay usuarios registrados aún</td>
        </tr>
      `;
      usersCount.textContent = 'Sin usuarios';
      return;
    }

    // Actualizar contador
    usersCount.textContent = `${users.length} ${users.length === 1 ? 'usuario' : 'usuarios'} registrados`;

    // Renderizar tabla
    usersTableBody.innerHTML = users.map((user) => `
      <tr class="user-row" data-user-id="${user.id}">
        <td class="col-username">
          <strong>${escapeHtml(user.username)}</strong>
        </td>
        <td class="col-role">
          <span class="role-badge ${user.role}">
            <span class="role-icon">${roleIcons[user.role] || '👤'}</span>
            <span class="role-text">${roleLabels[user.role] || user.role}</span>
          </span>
        </td>
        <td class="col-actions">
          <button type="button" class="action-button delete-user" title="Eliminar usuario" data-username="${escapeHtml(user.username)}">
            🗑️
          </button>
        </td>
      </tr>
    `).join('');

    // Agregar event listeners a los botones de eliminar
    document.querySelectorAll('.delete-user').forEach(btn => {
      btn.addEventListener('click', handleDeleteUser);
    });

  } catch (error) {
    console.error('Error cargando usuarios:', error);
    usersTableBody.innerHTML = `
      <tr class="error-state">
        <td colspan="3" class="error-message">❌ Error cargando usuarios</td>
      </tr>
    `;
    usersCount.textContent = 'Error cargando usuarios';
    showStatus(`Error: ${error.message}`, 'error');
  }
}

// ========== CREAR USUARIO ==========
async function createUser(event) {
  event.preventDefault();

  // Validaciones básicas
  const username = newUsernameInput.value.trim();
  const password = newPasswordInput.value.trim();
  const role = newRoleInput.value;

  if (!username || !password || !role) {
    showStatus('Por favor completa todos los campos', 'error');
    return;
  }

  if (password.length < 6) {
    showStatus('La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }

  try {
    const formData = new FormData(userForm);
    const payload = new URLSearchParams(formData);

    const response = await fetch('/api/admin/users', {
      method: 'POST',
      body: payload,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error creando el usuario');
    }

    showStatus(`✓ Usuario ${result.username} creado como ${roleLabels[result.role]}`, 'success');
    userForm.reset();
    
    // Recargar usuarios después de 1 segundo
    setTimeout(fetchUsers, 1000);

  } catch (error) {
    console.error('Error creando usuario:', error);
    showStatus(`✗ ${error.message}`, 'error');
  }
}

// ========== ELIMINAR USUARIO ==========
async function handleDeleteUser(event) {
  const username = event.target.dataset.username;
  
  if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${username}"?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/users/${username}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error eliminando usuario');
    }

    showStatus(`✓ Usuario ${username} eliminado correctamente`, 'success');
    fetchUsers();

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    showStatus(`✗ Error eliminando usuario: ${error.message}`, 'error');
  }
}

// ========== MOSTRAR ESTADO ==========
function showStatus(message, type) {
  userStatus.textContent = message;
  userStatus.classList.remove('active', 'success', 'error');
  userStatus.classList.add('active', type);

  // Auto-limpiar después de 4 segundos si es éxito
  if (type === 'success') {
    setTimeout(() => {
      userStatus.classList.remove('active', 'success');
      userStatus.textContent = '';
    }, 4000);
  }
}

// ========== UTILIDAD: ESCAPE HTML ==========
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ========== INICIALIZACIÓN ==========
if (userForm) {
  userForm.addEventListener('submit', createUser);
  fetchUsers();
}
