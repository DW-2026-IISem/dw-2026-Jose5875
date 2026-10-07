import { Application, Router } from "express";
import { ResourceRolesController } from "./resource-roles.controller";
import { requireAuth, requirePermission } from "../access";

export class ResourceRolesRoutes {
  public routes(app: Application): void {
    const router = Router();
    const controller = new ResourceRolesController();

    router.use(requireAuth);
    router.get("/", controller.getAll);
    router.get("/:id", requirePermission("GET", "/api/concesiones-rol/:id"), controller.getOne);
    router.post("/", requirePermission("POST", "/api/concesiones-rol"), controller.create);
    router.patch("/:id/deactivate", requirePermission("PATCH", "/api/concesiones-rol/:id/deactivate"), controller.deactivate);
    router.patch("/:id/reactivate", requirePermission("PATCH", "/api/concesiones-rol/:id/reactivate"), controller.reactivate);

    app.use("/api/concesiones-rol", router);
  }
}
