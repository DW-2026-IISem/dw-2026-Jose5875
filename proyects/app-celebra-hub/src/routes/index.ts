import { ClientesRoutes } from "../features/business/clientes/clientes.routes";
import { ServiciosRoutes } from "../features/business/servicios/servicios.routes";
import { SalonesRoutes } from "../features/business/salones/salones.routes";
import { EventoServiciosRoutes } from "../features/business/evento-servicios/evento-servicios.routes";

export class Routes {
  public clientesRoutes: ClientesRoutes =
    new ClientesRoutes();

  public serviciosRoutes: ServiciosRoutes =
    new ServiciosRoutes();

  public salonesRoutes: SalonesRoutes =
    new SalonesRoutes();

  public eventoServiciosRoutes: EventoServiciosRoutes =
    new EventoServiciosRoutes();
}
