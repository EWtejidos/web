const routesContainer = document.getElementById("availableRoutes");
const manifestRows = document.getElementById("manifestRows");
const paginationLabel = document.getElementById("paginationLabel");
const manifestTitle = document.getElementById("manifestTitle");
const dateInput = document.getElementById("planDate");
const feedback = document.getElementById("mapFeedback");
const routeToggle = document.getElementById("toggleRoutes");
const shipmentFilters = Array.from(document.querySelectorAll(".transport-filters input"));

let showingAllRoutes = false;
let shipments = [];

async function loadTransportOrders() {
  try {
    const response = await fetch("/api/transport/orders", {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    shipments = await response.json();
    renderRoutes();
    renderShipments();
    feedback.textContent = `Cargando ${shipments.length} ordenes reales de transporte.`;
  } catch (error) {
    console.error("No fue posible cargar ordenes de transporte", error);
    shipments = [];
    renderRoutes();
    renderShipments();
    feedback.textContent = "No se pudieron cargar las ordenes desde el backend.";
  }
}

function mapShipmentStatus(order) {
  if (order.status === "listo_envio") {
    return { status: "listo_envio", label: "Listo para entrega", action: "recoger" };
  }
  if (order.status === "en_camino") {
    return { status: "en_camino", label: "En camino", action: "entregar" };
  }
  if (order.status === "entregado") {
    return { status: "entregado", label: "Entregado", action: "confirmado" };
  }
  return { status: order.status || "pendiente", label: order.status || "Pendiente", action: "pendiente" };
}

function renderRoutes() {
  const routes = shipments
    .slice(0, showingAllRoutes ? shipments.length : 8)
    .map((order, index) => {
      const action = mapShipmentStatus(order);
      return `
        <article class="route-item">
          <span class="route-index">${index + 1}</span>
          <span>${action.label} · ${order.cliente}</span>
        </article>
      `;
    });

  routesContainer.innerHTML = routes.length ? routes.join("") : `
    <article class="route-item">
      <span class="route-index">-</span>
      <span>No hay rutas activas.</span>
    </article>
  `;
}

function renderShipments() {
  const selectedFilters = shipmentFilters.filter((item) => item.checked).map((item) => item.value);

  const filtered = shipments.filter((order) => {
    const shipment = mapShipmentStatus(order);
    return selectedFilters.includes(shipment.status) || selectedFilters.includes(shipment.action);
  });

  manifestRows.innerHTML = filtered
    .map((order) => {
      const shipment = mapShipmentStatus(order);
      const address = order.pickup_address
        ? `Recoger: ${order.pickup_address}<br>Entregar: ${order.delivery_address}`
        : order.delivery_address;

      return `
        <tr>
          <td><span class="action-pill ${shipment.action}">${shipment.action}</span></td>
          <td>${order.cliente}</td>
          <td>${address}</td>
          <td>${order.id_orden}</td>
          <td>${order.weaver || "No asignado"}</td>
          <td><span class="status-pill ${shipment.status}">${shipment.label}</span></td>
        </tr>
      `;
    })
    .join("");

  const visible = filtered.length;
  paginationLabel.textContent = visible ? `1 - ${visible} ordenes` : "0 ordenes";
  manifestTitle.textContent = visible
    ? "Despachos priorizados del turno manana"
    : "No hay ordenes para los filtros seleccionados";
}

dateInput.value = new Date().toISOString().slice(0, 10);

shipmentFilters.forEach((filter) => {
  filter.addEventListener("change", renderShipments);
});

routeToggle.addEventListener("click", () => {
  showingAllRoutes = !showingAllRoutes;
  routeToggle.textContent = showingAllRoutes ? "Ver menos" : "Ver mas";
  renderRoutes();
});

document.getElementById("viewMapButton").addEventListener("click", () => {
  feedback.textContent = `Mapa preparado para la fecha ${dateInput.value}.`;
});

document.getElementById("printButton").addEventListener("click", () => {
  feedback.textContent = "Vista lista para impresion de la hoja de ruta.";
});

document.getElementById("prevPage").addEventListener("click", () => {
  feedback.textContent = "Mostrando el primer bloque de ordenes priorizadas.";
});

document.getElementById("nextPage").addEventListener("click", () => {
  feedback.textContent = "No hay mas paginas en este ejemplo, pero el paginador ya quedo visible.";
});

loadTransportOrders();
