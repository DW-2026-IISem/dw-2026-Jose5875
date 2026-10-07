import { Application } from "express";
import { authenticate } from "../access";
import { RefreshTokensController } from "./refresh-tokens.controller";

export class RefreshTokensRoutes {
  private readonly controller = new RefreshTokensController();

  public routes(app: Application): void {
    app
      .route("/api/sesiones")
      .get(authenticate, this.controller.getAll.bind(this.controller))
      .delete(authenticate, this.controller.purge.bind(this.controller));

    app
      .route("/api/sesiones/deactivate-all")
      .patch(authenticate, this.controller.revokeAll.bind(this.controller));

    app
      .route("/api/sesiones/:id")
      .get(authenticate, this.controller.getOne.bind(this.controller));

    app
      .route("/api/sesiones/:id/deactivate")
      .patch(authenticate, this.controller.revokeOne.bind(this.controller));
  }
}
