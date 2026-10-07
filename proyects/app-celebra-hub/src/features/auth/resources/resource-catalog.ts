export interface CatalogResource {
  method: string;
  path: string;
  description: string;
}

export const RESOURCE_CATALOG: readonly CatalogResource[] = [
  // ==================== CLIENTES ====================
  { method: "GET", path: "/api/clientes", description: "Listar clientes" },
  { method: "GET", path: "/api/clientes/:id", description: "Consultar cliente" },
  { method: "POST", path: "/api/clientes", description: "Crear cliente" },
  { method: "PUT", path: "/api/clientes/:id", description: "Reemplazar cliente" },
  { method: "PATCH", path: "/api/clientes/:id", description: "Modificar cliente" },
  { method: "DELETE", path: "/api/clientes/:id", description: "Eliminar cliente" },
  { method: "PATCH", path: "/api/clientes/:id/deactivate", description: "Desactivar cliente" },

  // ==================== SERVICIOS ====================
  { method: "GET", path: "/api/servicios", description: "Listar servicios" },
  { method: "GET", path: "/api/servicios/:id", description: "Consultar servicio" },
  { method: "POST", path: "/api/servicios", description: "Crear servicio" },
  { method: "PUT", path: "/api/servicios/:id", description: "Reemplazar servicio" },
  { method: "PATCH", path: "/api/servicios/:id", description: "Modificar servicio" },
  { method: "DELETE", path: "/api/servicios/:id", description: "Eliminar servicio" },
  { method: "PATCH", path: "/api/servicios/:id/deactivate", description: "Desactivar servicio" },

  // ==================== SALONES ====================
  { method: "GET", path: "/api/salones", description: "Listar salones" },
  { method: "GET", path: "/api/salones/:id", description: "Consultar salón" },
  { method: "POST", path: "/api/salones", description: "Crear salón" },
  { method: "PUT", path: "/api/salones/:id", description: "Reemplazar salón" },
  { method: "PATCH", path: "/api/salones/:id", description: "Modificar salón" },
  { method: "DELETE", path: "/api/salones/:id", description: "Eliminar salón" },
  { method: "PATCH", path: "/api/salones/:id/deactivate", description: "Desactivar salón" },

  // ==================== RESERVAS ====================
  { method: "GET", path: "/api/reservas", description: "Listar reservas" },
  { method: "GET", path: "/api/reservas/:id", description: "Consultar reserva" },
  { method: "POST", path: "/api/reservas", description: "Crear reserva" },
  { method: "PUT", path: "/api/reservas/:id", description: "Reemplazar reserva" },
  { method: "PATCH", path: "/api/reservas/:id", description: "Modificar reserva" },
  { method: "DELETE", path: "/api/reservas/:id", description: "Eliminar reserva" },

  // ==================== EVENTOS ====================
  { method: "GET", path: "/api/eventos", description: "Listar eventos" },
  { method: "GET", path: "/api/eventos/:id", description: "Consultar evento" },
  { method: "POST", path: "/api/eventos", description: "Crear evento" },
  { method: "PUT", path: "/api/eventos/:id", description: "Reemplazar evento" },
  { method: "PATCH", path: "/api/eventos/:id", description: "Modificar evento" },
  { method: "DELETE", path: "/api/eventos/:id", description: "Eliminar evento" },

  // ==================== PROVEEDORES ====================
  { method: "GET", path: "/api/proveedores", description: "Listar proveedores" },
  { method: "GET", path: "/api/proveedores/:id", description: "Consultar proveedor" },
  { method: "POST", path: "/api/proveedores", description: "Crear proveedor" },
  { method: "PUT", path: "/api/proveedores/:id", description: "Reemplazar proveedor" },
  { method: "PATCH", path: "/api/proveedores/:id", description: "Modificar proveedor" },
  { method: "DELETE", path: "/api/proveedores/:id", description: "Eliminar proveedor" },
  { method: "PATCH", path: "/api/proveedores/:id/deactivate", description: "Desactivar proveedor" },

  // ==================== EVENTO-SERVICIOS ====================
  { method: "GET", path: "/api/evento-servicios", description: "Listar servicios de eventos" },
  { method: "GET", path: "/api/evento-servicios/:id", description: "Consultar servicio de evento" },
  { method: "POST", path: "/api/evento-servicios", description: "Crear servicio de evento" },
  { method: "PUT", path: "/api/evento-servicios/:id", description: "Reemplazar servicio de evento" },
  { method: "PATCH", path: "/api/evento-servicios/:id", description: "Modificar servicio de evento" },
  { method: "DELETE", path: "/api/evento-servicios/:id", description: "Eliminar servicio de evento" },

  // ==================== CONTRATOS ====================
  { method: "GET", path: "/api/contratos", description: "Listar contratos" },
  { method: "GET", path: "/api/contratos/:id", description: "Consultar contrato" },
  { method: "POST", path: "/api/contratos", description: "Crear contrato" },
  { method: "PUT", path: "/api/contratos/:id", description: "Reemplazar contrato" },
  { method: "PATCH", path: "/api/contratos/:id", description: "Modificar contrato" },
  { method: "DELETE", path: "/api/contratos/:id", description: "Eliminar contrato" },

  // ==================== PAGOS ====================
  { method: "GET", path: "/api/pagos", description: "Listar pagos" },
  { method: "GET", path: "/api/pagos/:id", description: "Consultar pago" },
  { method: "POST", path: "/api/pagos", description: "Registrar pago" },
  { method: "PUT", path: "/api/pagos/:id", description: "Reemplazar pago" },
  { method: "PATCH", path: "/api/pagos/:id", description: "Modificar pago" },
  { method: "DELETE", path: "/api/pagos/:id", description: "Eliminar pago" },

  // ==================== CAMBIOS DE CONTRATO ====================
  { method: "GET", path: "/api/cambios-contrato", description: "Listar cambios de contrato" },
  { method: "GET", path: "/api/cambios-contrato/:id", description: "Consultar cambio de contrato" },
  { method: "POST", path: "/api/cambios-contrato", description: "Crear cambio de contrato" },
  { method: "PUT", path: "/api/cambios-contrato/:id", description: "Reemplazar cambio de contrato" },
  { method: "PATCH", path: "/api/cambios-contrato/:id", description: "Modificar cambio de contrato" },
  { method: "DELETE", path: "/api/cambios-contrato/:id", description: "Eliminar cambio de contrato" },
  { method: "PATCH", path: "/api/cambios-contrato/:id/deactivate", description: "Desactivar cambio de contrato" },

  // ==================== CANCELACIONES ====================
  { method: "GET", path: "/api/cancelaciones", description: "Listar cancelaciones" },
  { method: "GET", path: "/api/cancelaciones/:id", description: "Consultar cancelación" },
  { method: "POST", path: "/api/cancelaciones", description: "Crear cancelación" },
  { method: "PUT", path: "/api/cancelaciones/:id", description: "Reemplazar cancelación" },
  { method: "PATCH", path: "/api/cancelaciones/:id", description: "Modificar cancelación" },
  { method: "DELETE", path: "/api/cancelaciones/:id", description: "Eliminar cancelación" },

  // ==================== USUARIOS ====================
  { method: "GET", path: "/api/usuarios", description: "Listar usuarios" },
  { method: "GET", path: "/api/usuarios/:id", description: "Consultar usuario" },
  { method: "POST", path: "/api/usuarios", description: "Crear usuario" },
  { method: "PUT", path: "/api/usuarios/:id", description: "Reemplazar usuario" },
  { method: "PATCH", path: "/api/usuarios/:id", description: "Modificar usuario" },
  { method: "DELETE", path: "/api/usuarios/:id", description: "Eliminar usuario" },
  { method: "PATCH", path: "/api/usuarios/:id/deactivate", description: "Desactivar usuario" },
  { method: "PATCH", path: "/api/usuarios/:id/password", description: "Cambiar contraseña" },
  { method: "GET", path: "/api/usuarios/:id/permisos", description: "Consultar permisos efectivos" },

  // ==================== ROLES ====================
  { method: "GET", path: "/api/roles", description: "Listar roles" },
  { method: "GET", path: "/api/roles/:id", description: "Consultar rol" },
  { method: "POST", path: "/api/roles", description: "Crear rol" },
  { method: "PUT", path: "/api/roles/:id", description: "Reemplazar rol" },
  { method: "PATCH", path: "/api/roles/:id", description: "Modificar rol" },
  { method: "DELETE", path: "/api/roles/:id", description: "Eliminar rol" },
  { method: "PATCH", path: "/api/roles/:id/deactivate", description: "Desactivar rol" },

  // ==================== RECURSOS ====================
  { method: "GET", path: "/api/recursos", description: "Listar recursos" },
  { method: "GET", path: "/api/recursos/:id", description: "Consultar recurso" },
  { method: "POST", path: "/api/recursos", description: "Crear recurso" },
  { method: "PUT", path: "/api/recursos/:id", description: "Reemplazar recurso" },
  { method: "PATCH", path: "/api/recursos/:id", description: "Modificar recurso" },
  { method: "DELETE", path: "/api/recursos/:id", description: "Eliminar recurso" },
  { method: "PATCH", path: "/api/recursos/:id/deactivate", description: "Desactivar recurso" },

  // ==================== USUARIO ↔ ROL ====================
  { method: "GET", path: "/api/asignaciones-rol", description: "Listar asignaciones usuario-rol" },
  { method: "GET", path: "/api/asignaciones-rol/:id", description: "Consultar asignación usuario-rol" },
  { method: "POST", path: "/api/asignaciones-rol", description: "Asignar rol a usuario" },
  { method: "PATCH", path: "/api/asignaciones-rol/:id/deactivate", description: "Retirar rol a usuario" },
  { method: "PATCH", path: "/api/asignaciones-rol/:id/reactivate", description: "Reactivar rol a usuario" },

  // ==================== ROL ↔ RECURSO ====================
  { method: "GET", path: "/api/concesiones-rol", description: "Listar concesiones rol-recurso" },
  { method: "GET", path: "/api/concesiones-rol/:id", description: "Consultar concesión rol-recurso" },
  { method: "POST", path: "/api/concesiones-rol", description: "Conceder recurso a rol" },
  { method: "PATCH", path: "/api/concesiones-rol/:id/deactivate", description: "Retirar recurso a rol" },
  { method: "PATCH", path: "/api/concesiones-rol/:id/reactivate", description: "Reactivar recurso a rol" },
];

export const COMERCIAL_RESOURCES = RESOURCE_CATALOG.filter((resource) =>
  [
    "/api/clientes",
    "/api/clientes/:id",
    "/api/reservas",
    "/api/reservas/:id",
    "/api/eventos",
    "/api/eventos/:id",
    "/api/servicios",
    "/api/servicios/:id",
  ].includes(resource.path)
);

export const OPERACIONES_RESOURCES = RESOURCE_CATALOG.filter((resource) =>
  [
    "/api/salones",
    "/api/salones/:id",
    "/api/reservas",
    "/api/reservas/:id",
    "/api/eventos",
    "/api/eventos/:id",
    "/api/servicios",
    "/api/servicios/:id",
    "/api/evento-servicios",
    "/api/evento-servicios/:id",
  ].includes(resource.path)
);

export const PROVEEDOR_RESOURCES = RESOURCE_CATALOG.filter((resource) =>
  [
    "/api/proveedores",
    "/api/proveedores/:id",
    "/api/evento-servicios",
    "/api/evento-servicios/:id",
  ].includes(resource.path)
);

export const CARTERA_RESOURCES = RESOURCE_CATALOG.filter((resource) =>
  [
    "/api/contratos",
    "/api/contratos/:id",
    "/api/pagos",
    "/api/pagos/:id",
    "/api/cambios-contrato",
    "/api/cambios-contrato/:id",
    "/api/cancelaciones",
    "/api/cancelaciones/:id",
  ].includes(resource.path)
);
