const currentPage = document.body.dataset.page;
const sidebarTarget = document.querySelector("[data-sidebar]");

const navigationItems = [
  { id: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "D" },
  { id: "productos", label: "Productos", href: "productos.html", icon: "P" },
  { id: "pedidos", label: "Pedidos", href: "pedidos.html", icon: "O" },
  { id: "perfil", label: "Perfil", href: "perfil.html", icon: "👤" }
];

if (sidebarTarget) {
  const navMarkup = navigationItems
    .map(
      (item) => `
        <a class="sidebar-link${item.id === currentPage ? " active" : ""}" href="${item.href}">
          <span class="sidebar-icon" aria-hidden="true">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `
    )
    .join("");

  sidebarTarget.innerHTML = `
    <div class="sidebar-shell">
      <div class="brand-block">
        <img class="brand-logo" src="images/Branding/logo.png" alt="Logo Etherial Whisper">
        <div class="brand-copy">
          <span class="brand-title">Etherial Whisper</span>
          <span class="brand-subtitle">Sistema web EW</span>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="Navegacion principal">
        ${navMarkup}
      </nav>

      <div class="sidebar-footer">
        <strong>Marca consistente</strong>
        <p>Sidebar compartido, rutas limpias y base lista para escalar.</p>
      </div>
    </div>
  `;
}
