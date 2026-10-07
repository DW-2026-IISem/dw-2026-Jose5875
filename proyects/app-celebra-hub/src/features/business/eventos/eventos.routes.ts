import { Application, Router } from "express";
import { authenticate, authorize } from "../../auth/access";
import { EventosController } from "./eventos.controller";

export class EventosRoutes {
  private readonly router = Router();
  private readonly controller = new EventosController();

  routes(app: Application): void {
    this.router.get("/", authenticate, authorize, this.controller.getAll.bind(this.controller));
    this.router.post("/", authenticate, authorize, this.controller.create.bind(this.controller));
    this.router.get("/:id", authenticate, authorize, this.controller.getOne.bind(this.controller));
    this.router.put("/:id", authenticate, authorize, this.controller.updatePut.bind(this.controller));
    this.router.patch("/:id", authenticate, authorize, this.controller.updatePatch.bind(this.controller));
    this.router.delete("/:id", authenticate, authorize, this.controller.delete.bind(this.controller));

    app.use("/api/eventos", this.router);
  }
}
