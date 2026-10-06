import {
  Application
} from "express";

import {
  EventoServiciosController
} from "./evento-servicios.controller";

export class EventoServiciosRoutes {

  public eventoServiciosController:
    EventoServiciosController =
      new EventoServiciosController();

  public routes(
    app: Application
  ): void {

    app
      .route("/api/evento-servicios")
      .get(
        this.eventoServiciosController
          .getAll
          .bind(
            this.eventoServiciosController
          )
      )
      .post(
        this.eventoServiciosController
          .create
          .bind(
            this.eventoServiciosController
          )
      );

    app
      .route("/api/evento-servicios/:id")
      .get(
        this.eventoServiciosController
          .getOne
          .bind(
            this.eventoServiciosController
          )
      )
      .put(
        this.eventoServiciosController
          .updatePut
          .bind(
            this.eventoServiciosController
          )
      )
      .patch(
        this.eventoServiciosController
          .updatePatch
          .bind(
            this.eventoServiciosController
          )
      )
      .delete(
        this.eventoServiciosController
          .deletePhysical
          .bind(
            this.eventoServiciosController
          )
      );

    app
      .route(
        "/api/evento-servicios/:id/deactivate"
      )
      .patch(
        this.eventoServiciosController
          .deleteLogical
          .bind(
            this.eventoServiciosController
          )
      );
  }
}
