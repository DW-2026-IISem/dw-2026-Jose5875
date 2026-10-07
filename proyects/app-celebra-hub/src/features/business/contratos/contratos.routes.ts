import { Application, Router } from "express";

import { ContratosController } from "./contratos.controller";

export class ContratosRoutes {

  private router: Router =
    Router();

  private controller:
    ContratosController =
    new ContratosController();

  public routes(
    app: Application
  ): void {

    app.use(
      "/api/contratos",
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
