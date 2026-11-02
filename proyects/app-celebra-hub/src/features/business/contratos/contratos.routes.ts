import { Application, Router } from "express";

import { businessApiAccess } from "../../auth/access";
import { ContratosController } from "./contratos.controller";

export class ContratosRoutes {
  private router: Router = Router();
  private controller: ContratosController = new ContratosController();

  public routes(app: Application): void {
    app.use("/api/contratos", this.router);

    this.router.get("/", businessApiAccess, this.controller.getAll.bind(this.controller));
    this.router.post("/", businessApiAccess, this.controller.create.bind(this.controller));
    this.router.get("/:id", businessApiAccess, this.controller.getOne.bind(this.controller));
    this.router.put("/:id", businessApiAccess, this.controller.updatePut.bind(this.controller));
    this.router.patch("/:id", businessApiAccess, this.controller.updatePatch.bind(this.controller));
    this.router.delete("/:id", businessApiAccess, this.controller.delete.bind(this.controller));
    this.router.patch("/:id/deactivate", businessApiAccess, this.controller.deactivate.bind(this.controller));
  }
}
