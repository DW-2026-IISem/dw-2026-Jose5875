import { Application, Router } from "express";

import { ProveedoresController } from "./proveedores.controller";

export class ProveedoresRoutes {

  private router: Router =
    Router();

  private controller:
    ProveedoresController =
    new ProveedoresController();

  public routes(
    app: Application
  ): void {

    app.use(
      "/api/proveedores",
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

    this.router.patch(
      "/:id/deactivate",
      this.controller.deactivate.bind(
        this.controller
      )
    );
  }
}
