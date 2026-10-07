import { ClientesRoutes } from "../features/business/clientes/clientes.routes";
import { ServiciosRoutes } from "../features/business/servicios/servicios.routes";
import { SalonesRoutes } from "../features/business/salones/salones.routes";
import { ReservasRoutes } from "../features/business/reservas/reservas.routes";
import { ProveedoresRoutes } from "../features/business/proveedores/proveedores.routes";
import { ContratosRoutes } from "../features/business/contratos/contratos.routes";
import { PagosRoutes } from "../features/business/pagos/pagos.routes";
import { CambiosContratoRoutes } from "../features/business/cambios-contrato/cambios-contrato.routes";
import { EventoServiciosRoutes } from "../features/business/evento-servicios/evento-servicios.routes";
import { CancelacionesRoutes } from "../features/business/cancelaciones/cancelaciones.routes";
import { EventosRoutes } from "../features/business/eventos/eventos.routes";

export class Routes {
  public clientesRoutes = new ClientesRoutes();
  public serviciosRoutes = new ServiciosRoutes();
  public salonesRoutes = new SalonesRoutes();
  public reservasRoutes = new ReservasRoutes();
  public proveedoresRoutes = new ProveedoresRoutes();
  public contratosRoutes = new ContratosRoutes();
  public pagosRoutes = new PagosRoutes();
  public cambiosContratoRoutes = new CambiosContratoRoutes();
  public eventoServiciosRoutes = new EventoServiciosRoutes();
  public cancelacionesRoutes = new CancelacionesRoutes();
  public eventosRoutes = new EventosRoutes();
}
