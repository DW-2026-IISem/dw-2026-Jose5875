import { Application, Router } from "express";
import { CancelacionesController } from "./cancelaciones.controller";

export class CancelacionesRoutes {
  private readonly router = Router();

  private readonly controller =
    new CancelacionesController();

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
      "/api/cancelaciones",
      this.router
    );
  }
}
