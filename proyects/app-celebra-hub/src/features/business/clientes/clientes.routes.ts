import {
  Application
} from "express";

import {
  ClientesController
} from "./clientes.controller";

export class ClientesRoutes {

  public clientesController:
    ClientesController =
      new ClientesController();

  public routes(
    app: Application
  ): void {

    // ================== GET ==================

    app
      .route("/api/clientes")
      .get(
        this.clientesController.getAll.bind(
          this.clientesController
        )
      );

    app
      .route("/api/clientes/:id")
      .get(
        this.clientesController.getOne.bind(
          this.clientesController
        )
      );

    // ================== CREATE ==================

    app
      .route("/api/clientes")
      .post(
        this.clientesController.create.bind(
          this.clientesController
        )
      );

    // ================== UPDATE ==================

    app
      .route("/api/clientes/:id")
      .put(
        this.clientesController.updatePut.bind(
          this.clientesController
        )
      )
      .patch(
        this.clientesController.updatePatch.bind(
          this.clientesController
        )
      );

    // ================== DELETE ==================

    app
      .route("/api/clientes/:id")
      .delete(
        this.clientesController.deletePhysical.bind(
          this.clientesController
        )
      );

    app
      .route("/api/clientes/:id/deactivate")
      .patch(
        this.clientesController.deleteLogical.bind(
          this.clientesController
        )
      );
  }
}
