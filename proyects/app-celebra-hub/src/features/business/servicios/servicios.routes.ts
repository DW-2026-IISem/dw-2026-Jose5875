import { Application } from "express";

import { authenticate, authorize } from "../../auth/access";
import { ServiciosController } from "./servicios.controller";

export class ServiciosRoutes {
  public serviciosController: ServiciosController = new ServiciosController();

  public routes(app: Application): void {
    app
      .route("/api/servicios")
      .get(authenticate, authorize, this.serviciosController.getAll.bind(this.serviciosController));

    app
      .route("/api/servicios/:id")
      .get(authenticate, authorize, this.serviciosController.getOne.bind(this.serviciosController));

    app
      .route("/api/servicios")
      .post(authenticate, authorize, this.serviciosController.create.bind(this.serviciosController));

    app
      .route("/api/servicios/:id")
      .put(authenticate, authorize, this.serviciosController.updatePut.bind(this.serviciosController))
      .patch(authenticate, authorize, this.serviciosController.updatePatch.bind(this.serviciosController));

    app
      .route("/api/servicios/:id")
      .delete(authenticate, authorize, this.serviciosController.deletePhysical.bind(this.serviciosController));

    app
      .route("/api/servicios/:id/deactivate")
      .patch(authenticate, authorize, this.serviciosController.deleteLogical.bind(this.serviciosController));
  }
}
