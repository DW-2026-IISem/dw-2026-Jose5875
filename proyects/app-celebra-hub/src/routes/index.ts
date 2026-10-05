import {
  ClientesRoutes
} from "../features/business/clientes/clientes.routes";

import {
  ServiciosRoutes
} from "../features/business/servicios/servicios.routes";

export class Routes {

  public clientesRoutes:
    ClientesRoutes =
      new ClientesRoutes();

  public serviciosRoutes:
    ServiciosRoutes =
      new ServiciosRoutes();
}
