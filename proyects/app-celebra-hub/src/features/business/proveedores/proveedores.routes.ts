import { Application, Router } from "express";

import { authenticate, authorize } from "../../auth/access";
import { ProveedoresController } from "./proveedores.controller";

export class ProveedoresRoutes {
  private router: Router = Router();
  private controller: ProveedoresController = new ProveedoresController();

  public routes(app: Application): void {
    app.use("/api/proveedores", this.router);

    this.router.get("/", authenticate, authorize, this.controller.getAll.bind(this.controller));
    this.router.post("/", authenticate, authorize, this.controller.create.bind(this.controller));
    this.router.get("/:id", authenticate, authorize, this.controller.getOne.bind(this.controller));
    this.router.put("/:id", authenticate, authorize, this.controller.updatePut.bind(this.controller));
    this.router.patch("/:id", authenticate, authorize, this.controller.updatePatch.bind(this.controller));
    this.router.delete("/:id", authenticate, authorize, this.controller.delete.bind(this.controller));
    this.router.patch("/:id/deactivate", authenticate, authorize, this.controller.deactivate.bind(this.controller));
  }
}
