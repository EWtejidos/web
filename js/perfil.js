const profileForm = document.getElementById("profileForm");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const addressInput = document.getElementById("address");
const photoUrlInput = document.getElementById("photoUrl");
const socialLinksInput = document.getElementById("socialLinks");
const profileStatus = document.getElementById("profileStatus");

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

async function loadProfile() {
  try {
    const response = await fetch("/api/users/me", {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const profile = await response.json();
    usernameInput.value = profile.username || "";
    emailInput.value = profile.email || "";
    phoneInput.value = profile.phone || "";
    addressInput.value = profile.address || "";
    photoUrlInput.value = profile.photo_url || "";
    socialLinksInput.value = formatSocialLinks(profile.social_links || []);
    profileStatus.textContent = "Perfil cargado correctamente.";
  } catch (error) {
    console.error("No fue posible cargar el perfil", error);
    profileStatus.textContent = "No se pudo cargar la informacion del perfil.";
  }
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    address: addressInput.value.trim(),
    photo_url: photoUrlInput.value.trim(),
    social_links: parseSocialLinks(socialLinksInput.value)
  };

  try {
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
      throw new Error(data.error || "No se pudo actualizar el perfil.");
    }

    profileStatus.textContent = "Perfil actualizado correctamente.";
  } catch (error) {
    console.error("Error guardando perfil", error);
    profileStatus.textContent = `Error guardando el perfil: ${error.message || error}`;
  }
});

loadProfile();
