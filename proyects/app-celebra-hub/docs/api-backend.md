# API backend de CelebraHub

Esta guia describe la API del sistema de gestion de eventos CelebraHub. Las rutas y campos se resumen a partir de los routers y modelos actuales del backend; la especificacion OpenAPI disponible en `/api-docs` es la referencia para los contratos detallados.

## Base de la API

- Prefijo de los recursos: `/api`.
- Puerto local predeterminado: `4000` (configurable mediante `PORT`).
- `GET /` devuelve el estado de la API y el nombre del proyecto.
- La API recibe cuerpos JSON.
- Los identificadores `:id` son numericos.
- En las rutas protegidas, adjuntar el access token en el encabezado HTTP `Authorization`.

### Acceso

| Nivel | Significado |
| --- | --- |
| Abierto | No requiere access token. Consulta las tablas de rutas para identificar los endpoints abiertos. |
| Autenticacion | Requiere un access token valido. |
| Autenticacion + permiso | Requiere un access token y un permiso RBAC para el metodo y la ruta solicitados. |

Las rutas de clientes y proveedores son publicas en todos los entornos. Las demas entidades de negocio aceptan solicitudes sin token unicamente en desarrollo cuando la conexion proviene de loopback (`localhost`); en otros entornos o desde otras redes se mantiene la autenticacion y, donde aplica, la autorizacion RBAC configurada. Las rutas de administracion mantienen sus controles de autenticacion y RBAC. Las rutas protegidas pueden responder `401` sin autenticacion o `403` sin el permiso requerido.

## Recursos de CelebraHub

En las tablas, `CRUD` representa `GET /<recurso>`, `POST /<recurso>`, `GET /<recurso>/:id`, `PUT /<recurso>/:id`, `PATCH /<recurso>/:id` y `DELETE /<recurso>/:id`. La ruta de desactivacion solo existe para los recursos que la enumeran.

| Recurso | Ruta base | Operaciones | Acceso |
| --- | --- | --- | --- |
| Clientes | `/api/clientes` | CRUD; `PATCH /:id/deactivate` | Abierto |
| Servicios | `/api/servicios` | CRUD; `PATCH /:id/deactivate` | Local en desarrollo; protegido en otros entornos |
| Salones | `/api/salones` | CRUD; `PATCH /:id/deactivate` | Local en desarrollo; protegido en otros entornos |
| Reservas | `/api/reservas` | CRUD | Local en desarrollo; protegido en otros entornos |
| Proveedores | `/api/proveedores` | CRUD; `PATCH /:id/deactivate` | Abierto |
| Contratos | `/api/contratos` | CRUD | Local en desarrollo; protegido en otros entornos |
| Cambios de contrato | `/api/cambios-contrato` | CRUD | Local en desarrollo; protegido en otros entornos |
| Pagos | `/api/pagos` | CRUD | Local en desarrollo; protegido en otros entornos |
| Cancelaciones | `/api/cancelaciones` | CRUD | Local en desarrollo; protegido en otros entornos |
| Servicios de evento | `/api/evento-servicios` | CRUD; `PATCH /:id/deactivate` | Local en desarrollo; protegido en otros entornos |
| Eventos | `/api/eventos` | CRUD | Local en desarrollo; protegido en otros entornos |

Los paths `/:id` y `/:id/deactivate` de la tabla se agregan a la ruta base. Por ejemplo, la desactivacion de un servicio usa `PATCH /api/servicios/:id/deactivate`.

### Campos principales

| Entidad | Campos de negocio |
| --- | --- |
| Cliente (`Cliente`) | `tipo_documento`, `numero_documento`, `nombre`, `telefono`, `email`, `is_active` |
| Servicio (`Servicio`) | `nombre`, `descripcion`, `is_active` |
| Salon (`Salon`) | `nombre`, `descripcion`, `is_active` |
| Reserva (`Reserva`) | `cliente_id`, `fecha_inicio`, `fecha_fin`, `estado`, `observaciones` |
| Proveedor (`Proveedor`) | `nit`, `razon_social`, `contacto`, `telefono`, `email`, `is_active` |
| Contrato (`Contrato`) | `cliente_id`, `numero`, `fecha_inicio`, `fecha_fin`, `valor`, `estado` |
| Cambio de contrato (`CambioContrato`) | `nombre`, `descripcion`, `is_active` |
| Pago (`Pago`) | `referencia_tipo`, `referencia_id`, `metodo`, `monto`, `fecha`, `estado` |
| Cancelacion (`Cancelacion`) | `nombre`, `descripcion`, `is_active` |
| Servicio de evento (`EventoServicio`) | `referencia_id`, `tipo`, `fecha`, `cantidad`, `observaciones`, `estado` |
| Evento (`Evento`) | `referencia_id`, `tipo`, `fecha`, `cantidad`, `observaciones`, `estado` |

Los modelos pueden incluir `id` y marcas de tiempo. El nombre y formato de estas marcas varia entre modelos. Algunos campos son opcionales; consulta los DTO y validaciones del recurso antes de construir formularios.

`CambioContrato` y `Cancelacion` son catalogos con nombre y descripcion en los modelos actuales; no representan por si solos un registro de cambio o cancelacion asociado a un contrato. `referencia_tipo` y `referencia_id` en pagos, y `referencia_id` en eventos y servicios de evento, son campos genericos: el modelo no declara ahi una relacion Sequelize hacia una entidad especifica.

### Relaciones de negocio

- `Reserva.cliente_id` y `Contrato.cliente_id` identifican al cliente relacionado.
- Los pagos y eventos usan campos de referencia para identificar el objeto correspondiente.
- Los modelos de salon, servicio, proveedor y cliente mantienen sus propios datos de catalogo y estado.

## Autenticacion, usuarios y permisos

### Sesion y endpoints de usuario autenticado

| Metodo | Ruta | Acceso | Uso |
| --- | --- | --- | --- |
| `POST` | `/api/sesion/login` | Abierto | Iniciar sesion. |
| `POST` | `/api/sesion/refresh` | Abierto | Renovar tokens. |
| `POST` | `/api/sesion/logout` | Abierto | Cerrar sesion mediante el refresh token. |
| `GET` | `/api/sesion/perfil` | Autenticacion | Consultar el perfil autenticado. |
| `GET` | `/api/permisos` | Autenticacion | Consultar los permisos efectivos del usuario autenticado. |
| `GET` | `/api/sesiones` | Autenticacion | Listar sesiones propias. |
| `DELETE` | `/api/sesiones` | Autenticacion | Eliminar sesiones propias inactivas. |
| `GET` | `/api/sesiones/:id` | Autenticacion | Consultar una sesion propia. |
| `PATCH` | `/api/sesiones/deactivate-all` | Autenticacion | Revocar las sesiones propias. |
| `PATCH` | `/api/sesiones/:id/deactivate` | Autenticacion | Revocar una sesion propia. |

Login recibe `identifier` y `password`. La respuesta de autenticacion entrega los tokens. La API no requiere RBAC adicional para consultar o revocar las sesiones del usuario autenticado.

### Administracion de acceso

| Entidad | Ruta | Operaciones actuales |
| --- | --- | --- |
| Usuarios | `/api/usuarios` | CRUD, `PATCH /:id/deactivate`, `PATCH /:id/password`, `GET /:id/permisos` |
| Roles | `/api/roles` | CRUD, `PATCH /:id/deactivate` |
| Recursos RBAC | `/api/recursos` | CRUD, `PATCH /:id/deactivate` |
| Asignaciones de rol | `/api/asignaciones-rol` | `GET`, `POST`; `GET /:id`; `PATCH /:id/deactivate`; `PATCH /:id/reactivate` |
| Concesiones de recurso a rol | `/api/concesiones-rol` | `GET`, `POST`; `GET /:id`; `PATCH /:id/deactivate`; `PATCH /:id/reactivate` |

Los endpoints administrativos protegidos requieren el permiso registrado para el metodo y la ruta. Los endpoints de lista de asignaciones y concesiones requieren autenticacion, pero no una comprobacion RBAC adicional en su ruta actual.

## Integracion con el frontend

- Consultar `GET /api/permisos` despues del inicio de sesion para adaptar la interfaz a los permisos efectivos; la proteccion real la aplica el backend.
- No asumir que todos los recursos tienen desactivacion logica: solo existe en los recursos enumerados con `PATCH /:id/deactivate`.
- Los campos de dominio de esta guia no sustituyen los contratos de entrada y salida definidos por los DTO ni la validacion de cada endpoint.
- La documentacion interactiva de OpenAPI esta disponible en `/api-docs`.
