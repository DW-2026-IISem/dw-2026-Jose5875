import { Application, Router } from "express";

import { ReservasController } from "./reservas.controller";

export class ReservasRoutes {

  private router: Router =
    Router();

  private controller:
    ReservasController =
    new ReservasController();

  public routes(
    app: Application
  ): void {

    app.use(
      "/api/reservas",
      this.router
    );

    this.router.get(
      "/",
      this.controller.getAll.bind(
        this.controller
      )
    );

    this.router.post(
      "/",
      this.controller.create.bind(
        this.controller
      )
    );

    this.router.get(
      "/:id",
      this.controller.getOne.bind(
        this.controller
      )
    );

    this.router.put(
      "/:id",
      this.controller.updatePut.bind(
        this.controller
      )
    );

    this.router.patch(
      "/:id",
      this.controller.updatePatch.bind(
        this.controller
      )
    );

    this.router.delete(
      "/:id",
      this.controller.delete.bind(
        this.controller
      )
    );
  }
}
