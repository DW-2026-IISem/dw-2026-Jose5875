import { Application, Router } from "express";
import { PagosController } from "./pagos.controller";

export class PagosRoutes {
  private readonly router = Router();
  private readonly controller = new PagosController();

  routes(app: Application) {
    this.router.get("/", this.controller.getAll);
    this.router.post("/", this.controller.create);
    this.router.get("/:id", this.controller.getOne);
    this.router.put("/:id", this.controller.updatePut);
    this.router.patch("/:id", this.controller.updatePatch);
    this.router.delete("/:id", this.controller.delete);

    app.use("/api/pagos", this.router);
  }
}
