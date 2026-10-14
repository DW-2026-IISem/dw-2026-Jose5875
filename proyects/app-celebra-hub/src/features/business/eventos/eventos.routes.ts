import { Application, Router } from "express";
import { authenticate, authorize } from "../../auth/access";
import { EventosController } from "./eventos.controller";

export class EventosRoutes {
  private readonly router = Router();
  private readonly controller = new EventosController();

  routes(app: Application): void {
    this.router.get("/", authenticate, this.controller.getAll.bind(this.controller));
    this.router.post("/", authenticate, this.controller.create.bind(this.controller));
    this.router.get("/:id", authenticate, this.controller.getOne.bind(this.controller));
    this.router.put("/:id", authenticate, this.controller.updatePut.bind(this.controller));
    this.router.patch("/:id", authenticate, this.controller.updatePatch.bind(this.controller));
    this.router.delete("/:id", authenticate, this.controller.delete.bind(this.controller));

    app.use("/api/eventos", this.router);
  }
}
