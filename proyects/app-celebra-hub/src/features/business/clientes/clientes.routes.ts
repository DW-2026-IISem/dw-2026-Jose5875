import { Application } from "express";

import { authenticate, authorize } from "../../auth/access";
import { ClientesController } from "./clientes.controller";

export class ClientesRoutes {
  public clientesController: ClientesController = new ClientesController();

  public routes(app: Application): void {
    app
      .route("/api/clientes")
      .get(authenticate, this.clientesController.getAll.bind(this.clientesController));

    app
      .route("/api/clientes/:id")
      .get( authenticate, this.clientesController.getOne.bind(this.clientesController));

    app
      .route("/api/clientes")
      .post( authenticate, this.clientesController.create.bind(this.clientesController));

    app
      .route("/api/clientes/:id")
      .put( authenticate, this.clientesController.updatePut.bind(this.clientesController))
      .patch( authenticate, this.clientesController.updatePatch.bind(this.clientesController));

    app
      .route("/api/clientes/:id")
      .delete( authenticate, this.clientesController.deletePhysical.bind(this.clientesController));

    app
      .route("/api/clientes/:id/deactivate")
      .patch( authenticate, this.clientesController.deleteLogical.bind(this.clientesController));
  }
}
