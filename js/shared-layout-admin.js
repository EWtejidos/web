const currentAdminPage = document.body.dataset.page;
const adminSidebarTarget = document.querySelector("[data-sidebar]");

const adminNavigationItems = [
  { id: "general", label: "Vista general", href: "tableroadmin.html", icon: "V" },
  { id: "anticipos", label: "Verificacion de anticipos", href: "anticiposadmin.html", icon: "A" },
  { id: "ordenes", label: "Gestion de ordenes", href: "ordenesadmin.html", icon: "O" },
  { id: "transporte", label: "Gestion de transporte", href: "transporteadmin.html", icon: "T" },
  { id: "contabilidad", label: "Contabilidad", href: "contabilidadadmin.html", icon: "C" },
  { id: "bases", label: "Bases de datos", href: "basesadmin.html", icon: "B" },
  { id: "usuarios", label: "Crear usuarios", href: "usuariosadmin.html", icon: "👤" }
];

if (adminSidebarTarget) {
  const navMarkup = adminNavigationItems
    .map(
      (item) => `
        <a class="sidebar-link${item.id === currentAdminPage ? " active" : ""}" href="${item.href}">
          <span class="sidebar-icon" aria-hidden="true">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `
    )
    .join("");

  adminSidebarTarget.innerHTML = `
    <div class="sidebar-shell">
      <div class="brand-block">
        <img class="brand-logo" src="images/Branding/logo.png" alt="Logo Etherial Whisper">
        <div class="brand-copy">
          <span class="brand-title">Etherial Whisper</span>
          <span class="brand-subtitle">Administracion EW</span>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="Navegacion administrativa">
        ${navMarkup}
      </nav>

      <div class="sidebar-footer">
        <strong>Operacion visible</strong>
        <p>Cada modulo tiene su propia pagina y sus pestañas internas trabajan sin recargar.</p>
      </div>
    </div>
  `;
}
