import { Application } from "express";

export class RolesRoutes {
  public routes(app: Application): void {
    app.route("/api/roles").get((_req, res) => {
      res.status(200).json({ message: "Roles auth ready" });
    });
  }
}
