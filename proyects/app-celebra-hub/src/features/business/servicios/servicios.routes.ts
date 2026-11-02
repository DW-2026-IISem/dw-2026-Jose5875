import { Application } from "express";

import { businessApiAccess } from "../../auth/access";
import { ServiciosController } from "./servicios.controller";

export class ServiciosRoutes {
  public serviciosController: ServiciosController = new ServiciosController();

  public routes(app: Application): void {
    app
      .route("/api/servicios")
      .get(businessApiAccess, this.serviciosController.getAll.bind(this.serviciosController));

    app
      .route("/api/servicios/:id")
      .get(businessApiAccess, this.serviciosController.getOne.bind(this.serviciosController));

    app
      .route("/api/servicios")
      .post(businessApiAccess, this.serviciosController.create.bind(this.serviciosController));

    app
      .route("/api/servicios/:id")
      .put(businessApiAccess, this.serviciosController.updatePut.bind(this.serviciosController))
      .patch(businessApiAccess, this.serviciosController.updatePatch.bind(this.serviciosController));

    app
      .route("/api/servicios/:id")
      .delete(businessApiAccess, this.serviciosController.deletePhysical.bind(this.serviciosController));

    app
      .route("/api/servicios/:id/deactivate")
      .patch(businessApiAccess, this.serviciosController.deleteLogical.bind(this.serviciosController));
  }
}
