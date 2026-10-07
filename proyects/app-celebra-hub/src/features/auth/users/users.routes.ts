import { Application } from "express";

export class UsersRoutes {
  public routes(app: Application): void {
    app.route("/api/users").get((_req, res) => {
      res.status(200).json({ message: "Users auth ready" });
    });

    app.route("/api/users/:id").get((_req, res) => {
      res.status(200).json({ message: "User detail ready" });
    });
  }
}
