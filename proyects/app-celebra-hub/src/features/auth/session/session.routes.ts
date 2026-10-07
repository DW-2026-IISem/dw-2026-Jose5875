import { Application } from "express";
import { authenticate } from "../access";
import { SessionController } from "./session.controller";

export class SessionRoutes {
  private readonly controller = new SessionController();

  public routes(app: Application): void {
    app.route("/api/sesion/login").post(this.controller.login.bind(this.controller));
    app.route("/api/sesion/refresh").post(this.controller.refresh.bind(this.controller));
    app.route("/api/sesion/logout").post(this.controller.logout.bind(this.controller));
    app
      .route("/api/sesion/perfil")
      .get(authenticate, this.controller.profile.bind(this.controller));

    app
      .route("/api/permisos")
      .get(authenticate, this.controller.myPermissions.bind(this.controller));
  }
}
