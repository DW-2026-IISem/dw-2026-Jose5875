import { Application } from "express";

import { ServiciosController } from "./servicios.controller";

export class ServiciosRoutes {

  public serviciosController:
    ServiciosController =
      new ServiciosController();

  public routes(
    app: Application
  ): void {

    // ================== GET ALL ==================

    app
      .route("/api/servicios")
      .get(
        this.serviciosController.getAll.bind(
          this.serviciosController
        )
      );

    // ================== GET ONE ==================

    app
      .route("/api/servicios/:id")
      .get(
        this.serviciosController.getOne.bind(
          this.serviciosController
        )
      );

    // ================== CREATE ==================

    app
      .route("/api/servicios")
      .post(
        this.serviciosController.create.bind(
          this.serviciosController
        )
      );

    // ================== UPDATE ==================

    app
      .route("/api/servicios/:id")
      .put(
        this.serviciosController.updatePut.bind(
          this.serviciosController
        )
      )
      .patch(
        this.serviciosController.updatePatch.bind(
          this.serviciosController
        )
      );

    // ================== DELETE FÍSICO ==================

    app
      .route("/api/servicios/:id")
      .delete(
        this.serviciosController.deletePhysical.bind(
          this.serviciosController
        )
      );

    // ================== DELETE LÓGICO ==================

    app
      .route("/api/servicios/:id/deactivate")
      .patch(
        this.serviciosController.deleteLogical.bind(
          this.serviciosController
        )
      );
  }
}
