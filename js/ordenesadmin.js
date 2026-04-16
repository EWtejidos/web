const ordenesContainer = document.getElementById("moduleContent");
const ordenesStatus = document.getElementById("statusBadge");
const ordenesTabs = document.querySelectorAll("[data-tab]");

let ordenesTabActual = "fase1";
const ordenesFiltros = { conFecha: true, sinFecha: true, asignado: true, noAsignado: true };
let ordenes = [];

renderOrdenesTab();
loadOrdenes();

ordenesTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    ordenesTabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    ordenesTabActual = tab.dataset.tab;
    renderOrdenesTab();
  });
});

ordenesContainer.addEventListener("change", (event) => {
  if (!event.target.matches("[data-filter]")) {
    return;
  }

  ordenesFiltros[event.target.dataset.filter] = event.target.checked;
  renderOrdenesTab();
});

ordenesContainer.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const item = ordenes.find((orden) => String(orden.id) === button.dataset.id);
  if (!item) {
    adminCommon.setStatus(ordenesStatus, "No se encontro la orden seleccionada.");
    return;
  }

  if (button.dataset.action === "edit") {
    openEditModal(item);
    return;
  }

  if (button.dataset.action === "message-client") {
    openClientMessageModal(item);
    return;
  }

  const messages = {
    assign: `Asignacion pendiente para ${item.orderCode}.`,
    edit: `Editando orden ${item.orderCode}.`,
    "message-weaver": `Mensaje listo para tejedoras sobre ${item.orderCode}.`,
    "message-client": `Mensaje preparado para ${item.cliente} sobre ${item.orderCode}.`,
    ready: `Orden ${item.orderCode} lista para marcar cierre de produccion.`,
    "request-payment": `Solicitud de pago final pendiente para ${item.orderCode}.`,
    "approve-payment": `Pago final de ${item.orderCode} listo para validacion administrativa.`,
    "reject-payment": `Pago final de ${item.orderCode} marcado para revision.`,
    "send-transport": `Orden ${item.orderCode} lista para pasar a transporte.`
  };

  adminCommon.setStatus(ordenesStatus, messages[button.dataset.action] || `Accion lista para ${item.orderCode}.`);
});

function openEditModal(item) {
  // Abre modal para editar deadline y quote_max
  const deadline = prompt("Fecha límite (nuevo):", item.deadline || "");
  if (deadline === null) return;

  const quoteMax = prompt("Cotización máxima (nuevo):", item.price || "");
  if (quoteMax === null) return;

  // Aquí va la lógica de actualización
  adminCommon.setStatus(ordenesStatus, `Datos de ${item.orderCode} actualizados. (Implementar endpoint)`);
}

function openClientMessageModal(item) {
  // Calcula siguiente sábado desde deadline
  const deadlineDate = new Date(item.deadline || Date.now());
  const saturdayDate = getNextSaturday(deadlineDate);
  const paymentDate = new Date(saturdayDate);
  paymentDate.setDate(paymentDate.getDate() - 1);

  const formattedSaturday = saturdayDate.toLocaleDateString("es-CO");
  const formattedPayment = paymentDate.toLocaleDateString("es-CO");

  const message = `Tu pedido estará listo el ${item.deadline}. Se entregará el ${formattedSaturday}. Debes completar el pago antes del ${formattedPayment}. Mira las políticas de compra.`;

  alert(`Mensaje para ${item.cliente} (${item.waId}):\n\n${message}`);
  
  // Marcar como contactado
  item.contactClient = true;
  adminCommon.setStatus(ordenesStatus, `Contacto registrado para ${item.orderCode}. Moviendo a Fase 2...`);
}

function getNextSaturday(fromDate) {
  const date = new Date(fromDate);
  const dayOfWeek = date.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntilSaturday);
  return date;
}

async function loadOrdenes() {
  adminCommon.setStatus(ordenesStatus, "Cargando ordenes reales...");

  try {
    const response = await fetch("/api/admin/orders", {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const orders = await response.json();
    ordenes = orders.map(mapOrderForView);
    renderOrdenesTab();
    adminCommon.setStatus(ordenesStatus, `${ordenes.length} ordenes cargadas desde la base de datos.`);
  } catch (error) {
    console.error("No fue posible cargar las ordenes", error);
    ordenes = [];
    renderOrdenesTab();
    adminCommon.setStatus(ordenesStatus, "No fue posible cargar las ordenes desde el backend.");
  }
}

function mapOrderForView(order) {
  const workflow = mapWorkflowStatus(order.status);

  return {
    id: order.id,
    orderCode: order.id_orden || `#${order.id}`,
    idOrden: order.id_orden || `#${order.id}`,
    cliente: order.cliente || "Cliente sin nombre",
    producto: order.producto || "Producto personalizado",
    product_name: order.product_name,
    productImage: normalizeImagePath(order.product_image),
    lengthCm: order.length_cm || "Sin dato",
    widthCm: order.width_cm || "Sin dato",
    description: order.description || "Sin descripcion",
    fecha: order.fecha || "",
    fechaHora: order.fecha_hora || "Sin fecha",
    deadline: order.deadline || "",
    assigned: Boolean(order.assigned_to),
    weaver: order.weaver || order.assigned_to || "Sin asignar",
    price: formatCurrency(order.quotacion_max || order.quotacion_min),
    startDate: order.fecha || "Pendiente",
    deliveryDate: order.deadline || "Por definir",
    paymentProof: normalizeImagePath(order.payment_proof),
    amount: formatCurrency(order.anticipo),
    checklist: order.description || "Pendiente checklist final",
    rawStatus: order.status,
    workflow,
    contactClient: false
  };
}

function mapWorkflowStatus(status) {
  if (["cotizacion", "pendiente_pago", "cotizacion_pendiente"].includes(status)) {
    return {
      fase1: true,
      fase2: false,
      fase3: false,
      fase4: false,
      statusLabel: "pendiente de pago"
    };
  }

  if (status === "pagado") {
    return {
      fase1: false,
      fase2: false,
      fase3: true,
      fase4: false,
      statusLabel: "pagado"
    };
  }

  if (status === "en_produccion") {
    return {
      fase1: false,
      fase2: true,
      fase3: false,
      fase4: false,
      statusLabel: "en producción"
    };
  }

  if (["listo_envio", "en_camino", "entregado"].includes(status)) {
    return {
      fase1: false,
      fase2: false,
      fase3: false,
      fase4: true,
      statusLabel: "listo para transporte"
    };
  }

  if (status === "rechazado") {
    return {
      fase1: false,
      fase2: false,
      fase3: false,
      fase4: false,
      statusLabel: "rechazado"
    };
  }

  return {
    fase1: true,
    fase2: false,
    fase3: false,
    fase4: false,
    statusLabel: status || "pendiente"
  };
}

function normalizeImagePath(path) {
  if (!path) {
    return "images/products/top.jpg";
  }

  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "Sin valor";
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(value));
}

function renderOrdenesTab() {
  const views = {
    fase1: renderFase1,
    fase2: renderFase2,
    fase3: renderFase3,
    fase4: renderFase4
  };

  ordenesContainer.innerHTML = views[ordenesTabActual]();
}

function renderFase1() {
  const fase1Ordenes = ordenes
    .filter((orden) => !orden.assigned || !orden.deadline || (orden.assigned && orden.deadline && !orden.contactClient));

  const markup = fase1Ordenes
    .map(
      (orden) => `
        <article class="record-card">
          <div class="record-main">
            <div class="record-title-row">
              <h4 class="record-title">Orden ${orden.orderCode} · ${orden.producto}</h4>
              <span class="status-badge ${adminCommon.normalizeStatusClass(orden.workflow.statusLabel)}">${adminCommon.formatStatus(orden.workflow.statusLabel)}</span>
            </div>
            <span class="record-meta">Cliente: ${orden.cliente} · Precio: ${orden.price}</span>
            <div class="inline-metrics">
              <span class="filter-chip">Entrega: ${orden.deadline || "Sin fecha"}</span>
              <span class="filter-chip">Tejedor: ${orden.weaver}</span>
              <span class="filter-chip">Largo: ${orden.lengthCm}</span>
              <span class="filter-chip">Ancho: ${orden.widthCm}</span>
            </div>
            <span class="muted">${orden.description}</span>
          </div>
          <div class="record-side">
            <div class="evidence-card">
              <span class="evidence-label">Referencia del pedido</span>
              <img class="evidence-image" src="${orden.productImage}" alt="Producto ${orden.orderCode}">
            </div>
          </div>
          <div class="record-actions">
            <button class="button secondary" type="button" data-action="edit" data-id="${orden.id}">Editar</button>
            <button class="button primary" type="button" data-action="message-client" data-id="${orden.id}">Escribir al cliente</button>
          </div>
        </article>
      `
    )
    .join("");

  return `
    <article class="section-card">
      <div class="section-topline">
        <div>
          <h4>Fase 1</h4>
          <span class="mini-copy">Ordenes sin tejedor asignado, sin fecha limite, o con tejedor y fecha pero sin contacto al cliente.</span>
        </div>
      </div>
      <div class="record-list">${markup || emptyState("No hay ordenes en fase 1.")}</div>
    </article>
  `;
}

function renderFase2() {
  const fase2Ordenes = ordenes.filter((orden) => orden.workflow.fase2);

  return `
    <article class="section-card">
      <div class="section-topline">
        <div>
          <h4>Produccion</h4>
          <span class="mini-copy">Ordenes con anticipo recibido y listas para seguimiento operativo.</span>
        </div>
      </div>
      <div class="record-list">
        ${fase2Ordenes
          .map(
            (orden) => `
              <article class="record-card production-card">
                <div class="record-main">
                  <div class="record-title-row">
                    <h4 class="record-title">Orden ${orden.orderCode} · ${orden.producto}</h4>
                    <span class="status-badge ${adminCommon.normalizeStatusClass(orden.workflow.statusLabel)}">${adminCommon.formatStatus(orden.workflow.statusLabel)}</span>
                  </div>
                  <span class="record-meta">Cliente: ${orden.cliente} · Tejedor: ${orden.weaver}</span>
                  <div class="production-dates">
                    <span>Inicio: ${orden.startDate}</span>
                    <span>Entrega: ${orden.deliveryDate}</span>
                  </div>
                </div>
                <div class="record-actions">
                  <button class="button primary" type="button" data-action="ready" data-id="${orden.id}">Marcar como listo</button>
                  <button class="button warning" type="button" data-action="request-payment" data-id="${orden.id}">Solicitar pago final</button>
                  <button class="button secondary" type="button" data-action="message-client" data-id="${orden.id}">Escribir al cliente</button>
                </div>
              </article>
            `
          )
          .join("") || emptyState("No hay ordenes en produccion todavia.")}
      </div>
    </article>
  `;
}

function renderFase3() {
  const fase3Ordenes = ordenes.filter((orden) => orden.workflow.fase3);

  return `
    <article class="section-card">
      <div class="section-topline">
        <div>
          <h4>Pago final</h4>
          <span class="mini-copy">Vista lista para validar comprobantes finales cuando ese estado exista en la base.</span>
        </div>
      </div>
      <div class="record-list">
        ${fase3Ordenes
          .map(
            (orden) => `
              <article class="record-card">
                <div class="record-main">
                  <div class="record-title-row">
                    <h4 class="record-title">Orden ${orden.orderCode}</h4>
                    <span class="status-badge ${adminCommon.normalizeStatusClass(orden.rawStatus)}">${adminCommon.formatStatus(orden.rawStatus)}</span>
                  </div>
                  <span class="record-meta">Cliente: ${orden.cliente} · Pago final ${orden.amount}</span>
                  <span class="muted">Orden lista para comprobante final.</span>
                </div>
                <div class="record-side">
                  <div class="evidence-card">
                    <span class="evidence-label">Comprobante cliente</span>
                    <img class="evidence-image" src="${orden.paymentProof}" alt="Comprobante pago final ${orden.orderCode}">
                  </div>
                </div>
                <div class="record-actions">
                  <button class="button primary" type="button" data-action="approve-payment" data-id="${orden.id}">Aprobar pago</button>
                  <button class="button danger" type="button" data-action="reject-payment" data-id="${orden.id}">Rechazar</button>
                  <button class="button secondary" type="button" data-action="message-client" data-id="${orden.id}">Escribir cliente</button>
                </div>
              </article>
            `
          )
          .join("") || emptyState("Aun no hay ordenes en fase de pago final.")}
      </div>
    </article>
  `;
}

function renderFase4() {
  const fase4Ordenes = ordenes.filter((orden) => orden.workflow.fase4);

  return `
    <article class="section-card">
      <div class="section-topline">
        <div>
          <h4>Cierre y despacho</h4>
          <span class="mini-copy">Ordenes terminadas listas para pasar al modulo de transporte.</span>
        </div>
      </div>
      <div class="record-list">
        ${fase4Ordenes
          .map(
            (orden) => `
              <article class="record-card">
                <div class="record-main">
                  <div class="record-title-row">
                    <h4 class="record-title">Orden ${orden.orderCode} · ${orden.producto}</h4>
                    <span class="status-badge pendiente">${orden.workflow.statusLabel}</span>
                  </div>
                  <span class="record-meta">Cliente: ${orden.cliente}</span>
                  <span class="muted">${orden.checklist}</span>
                </div>
                <div class="record-actions">
                  <button class="button primary" type="button" data-action="send-transport" data-id="${orden.id}">Pasar a transporte</button>
                  <button class="button secondary" type="button" data-action="message-client" data-id="${orden.id}">Escribir cliente</button>
                </div>
              </article>
            `
          )
          .join("") || emptyState("No hay ordenes listas para despacho todavia.")}
      </div>
    </article>
  `;
}

function emptyState(message) {
  return `<article class="record-card"><div class="record-main"><span class="record-meta">${message}</span></div></article>`;
}
