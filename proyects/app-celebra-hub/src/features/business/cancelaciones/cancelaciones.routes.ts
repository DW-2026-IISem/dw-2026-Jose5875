import { Application, Router } from "express";
import { businessApiAccess } from "../../auth/access";
import { CancelacionesController } from "./cancelaciones.controller";

export class CancelacionesRoutes {
  private readonly router = Router();
  private readonly controller = new CancelacionesController();

  routes(app: Application) {
    this.router.get("/", businessApiAccess, this.controller.getAll);
    this.router.post("/", businessApiAccess, this.controller.create);
    this.router.get("/:id", businessApiAccess, this.controller.getOne);
    this.router.put("/:id", businessApiAccess, this.controller.updatePut);
    this.router.patch("/:id", businessApiAccess, this.controller.updatePatch);
    this.router.patch("/:id/deactivate", businessApiAccess, this.controller.deactivate);
    this.router.delete("/:id", businessApiAccess, this.controller.delete);

    app.use("/api/cancelaciones", this.router);
  }
}
