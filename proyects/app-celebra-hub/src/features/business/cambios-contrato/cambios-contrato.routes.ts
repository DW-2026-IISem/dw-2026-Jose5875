import { Application, Router } from "express";
import { CambiosContratoController } from "./cambios-contrato.controller";

export class CambiosContratoRoutes {
  private readonly router = Router();

  private readonly controller =
    new CambiosContratoController();

  routes(app: Application) {
    this.router.get(
      "/",
      this.controller.getAll
    );

    this.router.post(
      "/",
      this.controller.create
    );

    this.router.get(
      "/:id",
      this.controller.getOne
    );

    this.router.put(
      "/:id",
      this.controller.updatePut
    );

    this.router.patch(
      "/:id",
      this.controller.updatePatch
    );

    this.router.delete(
      "/:id",
      this.controller.delete
    );

    app.use(
      "/api/cambios-contrato",
      this.router
    );
  }
}
