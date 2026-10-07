import { Application, Router } from "express";
import { authenticate, authorize } from "../../auth/access";
import { CambiosContratoController } from "./cambios-contrato.controller";

export class CambiosContratoRoutes {
  private readonly router = Router();
  private readonly controller = new CambiosContratoController();

  routes(app: Application) {
    this.router.get("/", authenticate, authorize, this.controller.getAll);
    this.router.post("/", authenticate, authorize, this.controller.create);
    this.router.get("/:id", authenticate, authorize, this.controller.getOne);
    this.router.put("/:id", authenticate, authorize, this.controller.updatePut);
    this.router.patch("/:id", authenticate, authorize, this.controller.updatePatch);
    this.router.delete("/:id", authenticate, authorize, this.controller.delete);

    app.use("/api/cambios-contrato", this.router);
  }
}
