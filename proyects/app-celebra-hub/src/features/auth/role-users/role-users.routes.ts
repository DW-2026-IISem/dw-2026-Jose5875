import { Application } from "express";

export class RoleUsersRoutes {
  public routes(app: Application): void {
    app.route("/api/role-users").get((_req, res) => {
      res.status(200).json({ message: "Role user assignments ready" });
    });
  }
}
