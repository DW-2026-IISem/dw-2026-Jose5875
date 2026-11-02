import { Application, Router } from "express";
import { localBusinessApiAccess } from "../../auth/access";
import { EventosController } from "./eventos.controller";

export class EventosRoutes {
  private readonly router = Router();
  private readonly controller = new EventosController();

  routes(app: Application): void {
    this.router.get("/", localBusinessApiAccess, this.controller.getAll.bind(this.controller));
    this.router.post("/", localBusinessApiAccess, this.controller.create.bind(this.controller));
    this.router.get("/:id", localBusinessApiAccess, this.controller.getOne.bind(this.controller));
    this.router.put("/:id", localBusinessApiAccess, this.controller.updatePut.bind(this.controller));
    this.router.patch("/:id", localBusinessApiAccess, this.controller.updatePatch.bind(this.controller));
    this.router.delete("/:id", localBusinessApiAccess, this.controller.delete.bind(this.controller));
    this.router.patch("/:id/deactivate", localBusinessApiAccess, this.controller.deactivate.bind(this.controller));

    app.use("/api/eventos", this.router);
  }
}
