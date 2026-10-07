import { Application } from "express";

export class ResourceRolesRoutes {
  public routes(app: Application): void {
    app.route("/api/resource-roles").get((_req, res) => {
      res.status(200).json({ message: "Resource role grants ready" });
    });
  }
}
