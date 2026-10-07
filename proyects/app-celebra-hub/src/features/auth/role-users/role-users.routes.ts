import { Application, Router } from "express";
import { RoleUsersController } from "./role-users.controller";
import { requireAuth, requirePermission } from "../access";

export class RoleUsersRoutes {
  public routes(app: Application): void {
    const router = Router();
    const controller = new RoleUsersController();

    router.use(requireAuth);
    router.get("/", controller.getAll);
    router.get("/:id", requirePermission("GET", "/api/asignaciones-rol/:id"), controller.getOne);
    router.post("/", requirePermission("POST", "/api/asignaciones-rol"), controller.assign);
    router.patch("/:id/deactivate", requirePermission("PATCH", "/api/asignaciones-rol/:id/deactivate"), controller.deactivate);
    router.patch("/:id/reactivate", requirePermission("PATCH", "/api/asignaciones-rol/:id/reactivate"), controller.reactivate);

    app.use("/api/asignaciones-rol", router);
  }
}
