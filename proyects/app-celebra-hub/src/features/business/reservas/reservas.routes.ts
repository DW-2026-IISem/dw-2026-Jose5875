import { Application, Router } from "express";

import { authenticate, authorize } from "../../auth/access";
import { ReservasController } from "./reservas.controller";

export class ReservasRoutes {
  private router: Router = Router();
  private controller: ReservasController = new ReservasController();

  public routes(app: Application): void {
    app.use("/api/reservas", this.router);

    this.router.get("/", authenticate, authorize, this.controller.getAll.bind(this.controller));
    this.router.post("/", authenticate, authorize, this.controller.create.bind(this.controller));
    this.router.get("/:id", authenticate, authorize, this.controller.getOne.bind(this.controller));
    this.router.put("/:id", authenticate, authorize, this.controller.updatePut.bind(this.controller));
    this.router.patch("/:id", authenticate, authorize, this.controller.updatePatch.bind(this.controller));
    this.router.delete("/:id", authenticate, authorize, this.controller.delete.bind(this.controller));
  }
}
