import { Application } from "express";

export class RefreshTokensRoutes {
  public routes(app: Application): void {
    app.route("/api/refresh-tokens").get((_req, res) => {
      res.status(200).json({ message: "Refresh tokens ready" });
    });
  }
}
