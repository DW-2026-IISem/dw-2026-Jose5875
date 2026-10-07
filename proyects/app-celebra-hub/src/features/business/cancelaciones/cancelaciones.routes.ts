import { Application, Router } from "express";
import { authenticate, authorize } from "../../auth/access";
import { CancelacionesController } from "./cancelaciones.controller";

export class CancelacionesRoutes {
  private readonly router = Router();
  private readonly controller = new CancelacionesController();

  routes(app: Application) {
    this.router.get("/", authenticate, authorize, this.controller.getAll);
    this.router.post("/", authenticate, authorize, this.controller.create);
    this.router.get("/:id", authenticate, authorize, this.controller.getOne);
    this.router.put("/:id", authenticate, authorize, this.controller.updatePut);
    this.router.patch("/:id", authenticate, authorize, this.controller.updatePatch);
    this.router.delete("/:id", authenticate, authorize, this.controller.delete);

    app.use("/api/cancelaciones", this.router);
  }
}
