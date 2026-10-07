import { Application } from "express";

import { authenticate, authorize } from "../../auth/access";
import { ClientesController } from "./clientes.controller";

export class ClientesRoutes {
  public clientesController: ClientesController = new ClientesController();

  public routes(app: Application): void {
    app
      .route("/api/clientes")
      .get(authenticate, authorize, this.clientesController.getAll.bind(this.clientesController));

    app
      .route("/api/clientes/:id")
      .get(authenticate, authorize, this.clientesController.getOne.bind(this.clientesController));

    app
      .route("/api/clientes")
      .post(authenticate, authorize, this.clientesController.create.bind(this.clientesController));

    app
      .route("/api/clientes/:id")
      .put(authenticate, authorize, this.clientesController.updatePut.bind(this.clientesController))
      .patch(authenticate, authorize, this.clientesController.updatePatch.bind(this.clientesController));

    app
      .route("/api/clientes/:id")
      .delete(authenticate, authorize, this.clientesController.deletePhysical.bind(this.clientesController));

    app
      .route("/api/clientes/:id/deactivate")
      .patch(authenticate, authorize, this.clientesController.deleteLogical.bind(this.clientesController));
  }
}
