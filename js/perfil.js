const profileForm = document.getElementById("profileForm");
const photoUploadInput = document.getElementById("photoUpload");
const profilePhotoPreview = document.getElementById("profilePhotoPreview");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const addressInput = document.getElementById("address");
const socialLinksInput = document.getElementById("socialLinks");
const profileStatus = document.getElementById("profileStatus");
const saveMessage = document.getElementById("saveMessage");
const displayUsername = document.getElementById("displayUsername");
const displayRole = document.getElementById("displayRole");
const topbarUsername = document.getElementById("topbarUsername");
const topbarUserPhoto = document.getElementById("topbarUserPhoto");

let currentProfile = null;
let selectedPhotoFile = null;

/* ========== FORMATEO Y PARSEO DE ENLACES ========== */
function formatSocialLinks(links) {
  if (!Array.isArray(links)) {
    return "";
  }
  return links.join("\n");
}

function parseSocialLinks(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/* ========== CARGA INICIAL DEL PERFIL ========== */
async function loadProfile() {
  profileStatus.textContent = "Cargando datos...";
  profileStatus.classList.remove("success", "error");
  
  try {
    const response = await fetch("/api/users/me", {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    currentProfile = await response.json();
    
    // Llenar inputs del formulario
    displayUsername.textContent = currentProfile.username || "Usuario";
    displayRole.textContent = `Rol: ${currentProfile.role || "usuario"}`;
    topbarUsername.textContent = currentProfile.username || "Mi cuenta";
    emailInput.value = currentProfile.email || "";
    phoneInput.value = currentProfile.phone || "";
    addressInput.value = currentProfile.address || "";
    socialLinksInput.value = formatSocialLinks(currentProfile.social_links || []);
    
    // Cargar foto de perfil
    if (currentProfile.photo_url) {
      profilePhotoPreview.src = currentProfile.photo_url;
      topbarUserPhoto.src = currentProfile.photo_url;
    }
    
    profileStatus.textContent = "✓ Perfil cargado correctamente";
    profileStatus.classList.add("success");
  } catch (error) {
    console.error("Error cargando perfil:", error);
    profileStatus.textContent = "✗ No se pudo cargar la información del perfil";
    profileStatus.classList.add("error");
  }
}

/* ========== MANEJO DE CARGA DE FOTOS ========== */
photoUploadInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validar tipo de archivo
  if (!file.type.startsWith("image/")) {
    showSaveMessage("Solo se permiten imágenes", "error");
    return;
  }

  // Validar tamaño (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showSaveMessage("La imagen no debe exceder 5MB", "error");
    return;
  }

  selectedPhotoFile = file;
  
  // Mostrar vista previa local
  const reader = new FileReader();
  reader.onload = (e) => {
    profilePhotoPreview.src = e.target.result;
  };
  reader.readAsDataURL(file);
  
  showSaveMessage("Foto seleccionada. Guarda los cambios para actualizar", "");
});

/* ========== ENVÍO DEL FORMULARIO ========== */
profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    address: addressInput.value.trim(),
    social_links: parseSocialLinks(socialLinksInput.value)
  };

  // Validar campos requeridos
  if (!payload.email || !payload.phone || !payload.address) {
    showSaveMessage("Por favor completa todos los campos requeridos", "error");
    return;
  }

  try {
    // Si hay foto seleccionada, subirla primero
    if (selectedPhotoFile) {
      await uploadPhoto(selectedPhotoFile, payload);
    } else {
      // Solo actualizar datos del perfil
      await updateProfile(payload);
    }
  } catch (error) {
    console.error("Error guardando perfil:", error);
    showSaveMessage(`Error: ${error.message || "No se pudo guardar"}`, "error");
  }
});

/* ========== CARGAR FOTO ========== */
async function uploadPhoto(file, payload) {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch("/api/users/me/photo", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "No se pudo cargar la foto");
  }

  const photoData = await response.json();
  payload.photo_url = photoData.photo_url;
  
  // Ahora actualizar el perfil con la foto
  await updateProfile(payload);
}

/* ========== ACTUALIZAR PERFIL ========== */
async function updateProfile(payload) {
  const response = await fetch("/api/users/me", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "No se pudo actualizar el perfil");
  }

  // Actualizar foto en topbar
  if (payload.photo_url) {
    topbarUserPhoto.src = payload.photo_url;
  }

  selectedPhotoFile = null;
  photoUploadInput.value = "";
  showSaveMessage("✓ Perfil actualizado correctamente", "success");
  
  // Recargar perfil después de 1.5 segundos
  setTimeout(() => {
    loadProfile();
  }, 1500);
}

/* ========== MOSTRAR MENSAJE DE GUARDADO ========== */
function showSaveMessage(message, type) {
  saveMessage.textContent = message;
  saveMessage.classList.remove("success", "error");
  if (type) {
    saveMessage.classList.add(type);
  }
  
  // Limpiar mensaje después de 4 segundos
  if (type !== "") {
    setTimeout(() => {
      saveMessage.textContent = "";
      saveMessage.classList.remove("success", "error");
    }, 4000);
  }
}

// Cargar perfil cuando el documento esté listo
document.addEventListener("DOMContentLoaded", loadProfile);
