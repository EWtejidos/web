const currentTransportPage = document.body.dataset.transportPage;
const transportSidebarTarget = document.querySelector("[data-transport-sidebar]");

const transportNavigationItems = [
  { id: "plan-envios", label: "Plan envios", href: "tablerotransportista.html", icon: "E" },
  { id: "ruta-optima", label: "Ruta optima", href: "rutaoptima.html", icon: "R" },
  { id: "confirmacion", label: "Confirmacion", href: "confirmaciontransporte.html", icon: "C" },
  { id: "perfil", label: "Perfil", href: "perfil.html", icon: "👤" }
];

if (transportSidebarTarget) {
  const navMarkup = transportNavigationItems
    .map(
      (item) => `
        <a class="sidebar-link${item.id === currentTransportPage ? " active" : ""}" href="${item.href}">
          <span class="sidebar-icon" aria-hidden="true">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `
    )
    .join("");

  transportSidebarTarget.innerHTML = `
    <div class="sidebar-shell">
      <div class="brand-block">
        <img class="brand-logo" src="images/Branding/logo.png" alt="Logo Etherial Whisper">
        <div class="brand-copy">
          <span class="brand-title">Etherial Whisper</span>
          <span class="brand-subtitle">Modulo transportista</span>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="Navegacion transportista">
        ${navMarkup}
      </nav>

      <div class="sidebar-footer">
        <strong>Ruta del dia</strong>
        <p>Controla recolecciones, optimiza el recorrido y confirma entregas desde el mismo modulo.</p>
      </div>
    </div>
  `;
}
