import { Application } from "express";

export class ResourcesRoutes {
  public routes(app: Application): void {
    app.route("/api/resources").get((_req, res) => {
      res.status(200).json({ message: "Resources auth ready" });
    });
  }
}
