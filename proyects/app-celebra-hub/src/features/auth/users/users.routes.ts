import { Application } from "express";
import { authenticate, authorize } from "../access";
import { UsersController } from "./users.controller";

export class UsersRoutes {
  public usersController: UsersController = new UsersController();

  public routes(app: Application): void {
    app.route("/api/usuarios").get(authenticate, authorize, this.usersController.getAll.bind(this.usersController));
    app.route("/api/usuarios/:id").get(authenticate, authorize, this.usersController.getOne.bind(this.usersController));
    app.route("/api/usuarios").post(authenticate, authorize, this.usersController.create.bind(this.usersController));
    app.route("/api/usuarios/:id").put(authenticate, authorize, this.usersController.updatePut.bind(this.usersController));
    app.route("/api/usuarios/:id").patch(authenticate, authorize, this.usersController.updatePatch.bind(this.usersController));
    app.route("/api/usuarios/:id").delete(authenticate, authorize, this.usersController.deletePhysical.bind(this.usersController));
    app.route("/api/usuarios/:id/deactivate").patch(authenticate, authorize, this.usersController.deleteLogical.bind(this.usersController));
    app.route("/api/usuarios/:id/password").patch(authenticate, authorize, this.usersController.changePassword.bind(this.usersController));
    app.route("/api/usuarios/:id/permisos").get(authenticate, authorize, this.usersController.getEffectivePermissions.bind(this.usersController));
  }
}
