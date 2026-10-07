import { Application } from "express";

import { authenticate, authorize } from "../../auth/access";
import { EventoServiciosController } from "./evento-servicios.controller";

export class EventoServiciosRoutes {
  public eventoServiciosController: EventoServiciosController = new EventoServiciosController();

  public routes(app: Application): void {
    app
      .route("/api/evento-servicios")
      .get(authenticate, authorize, this.eventoServiciosController.getAll.bind(this.eventoServiciosController))
      .post(authenticate, authorize, this.eventoServiciosController.create.bind(this.eventoServiciosController));

    app
      .route("/api/evento-servicios/:id")
      .get(authenticate, authorize, this.eventoServiciosController.getOne.bind(this.eventoServiciosController))
      .put(authenticate, authorize, this.eventoServiciosController.updatePut.bind(this.eventoServiciosController))
      .patch(authenticate, authorize, this.eventoServiciosController.updatePatch.bind(this.eventoServiciosController))
      .delete(authenticate, authorize, this.eventoServiciosController.deletePhysical.bind(this.eventoServiciosController));

    app
      .route("/api/evento-servicios/:id/deactivate")
      .patch(authenticate, authorize, this.eventoServiciosController.deleteLogical.bind(this.eventoServiciosController));
  }
}
