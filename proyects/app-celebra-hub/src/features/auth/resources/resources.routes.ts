import { Application } from "express";
import { ResourcesController } from "./resources.controller";
import { authenticate, authorize } from "../access";

/** Rutas del feature Resources — modalidad 3 (JWT + RBAC) en todas las operaciones. */
export class ResourcesRoutes {
  public resourcesController: ResourcesController = new ResourcesController();

  public routes(app: Application): void {
    app
      .route("/api/recursos")
      .get(authenticate, authorize, this.resourcesController.getAll.bind(this.resourcesController));

    app
      .route("/api/recursos/:id")
      .get(authenticate, authorize, this.resourcesController.getOne.bind(this.resourcesController));

    app
      .route("/api/recursos")
      .post(authenticate, authorize, this.resourcesController.create.bind(this.resourcesController));

    app
      .route("/api/recursos/:id")
      .put(
        authenticate,
        authorize,
        this.resourcesController.updatePut.bind(this.resourcesController)
      )
      .patch(
        authenticate,
        authorize,
        this.resourcesController.updatePatch.bind(this.resourcesController)
      );

    app
      .route("/api/recursos/:id")
      .delete(
        authenticate,
        authorize,
        this.resourcesController.deletePhysical.bind(this.resourcesController)
      );

    app
      .route("/api/recursos/:id/deactivate")
      .patch(
        authenticate,
        authorize,
        this.resourcesController.deleteLogical.bind(this.resourcesController)
      );
  }
}
