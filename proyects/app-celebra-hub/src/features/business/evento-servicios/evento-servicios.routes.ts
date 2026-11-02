import { Application } from "express";

import { businessApiAccess } from "../../auth/access";
import { EventoServiciosController } from "./evento-servicios.controller";

export class EventoServiciosRoutes {
  public eventoServiciosController: EventoServiciosController = new EventoServiciosController();

  public routes(app: Application): void {
    app
      .route("/api/evento-servicios")
      .get(businessApiAccess, this.eventoServiciosController.getAll.bind(this.eventoServiciosController))
      .post(businessApiAccess, this.eventoServiciosController.create.bind(this.eventoServiciosController));

    app
      .route("/api/evento-servicios/:id")
      .get(businessApiAccess, this.eventoServiciosController.getOne.bind(this.eventoServiciosController))
      .put(businessApiAccess, this.eventoServiciosController.updatePut.bind(this.eventoServiciosController))
      .patch(businessApiAccess, this.eventoServiciosController.updatePatch.bind(this.eventoServiciosController))
      .delete(businessApiAccess, this.eventoServiciosController.deletePhysical.bind(this.eventoServiciosController));

    app
      .route("/api/evento-servicios/:id/deactivate")
      .patch(businessApiAccess, this.eventoServiciosController.deleteLogical.bind(this.eventoServiciosController));
  }
}
