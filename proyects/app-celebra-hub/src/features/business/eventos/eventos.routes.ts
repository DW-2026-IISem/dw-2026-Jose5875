import { Application, Router } from "express";
import { EventosController } from "./eventos.controller";

export class EventosRoutes {
  private readonly router = Router();
  private readonly controller = new EventosController();

  routes(app: Application): void {
    this.router.get("/", this.controller.getAll.bind(this.controller));
    this.router.post("/", this.controller.create.bind(this.controller));

    this.router.get(
      "/:id",
      this.controller.getOne.bind(this.controller)
    );

    this.router.put(
      "/:id",
      this.controller.updatePut.bind(this.controller)
    );

    this.router.patch(
      "/:id",
      this.controller.updatePatch.bind(this.controller)
    );

    this.router.delete(
      "/:id",
      this.controller.delete.bind(this.controller)
    );

    app.use("/api/eventos", this.router);
  }
}
