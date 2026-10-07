import { Application } from "express";

export class SessionRoutes {
  public routes(app: Application): void {
    app.route("/api/sesion/login").post((_req, res) => {
      res.status(200).json({ message: "Auth module ready", mode: "login" });
    });

    app.route("/api/sesion/refresh").post((_req, res) => {
      res.status(200).json({ message: "Auth module ready", mode: "refresh" });
    });

    app.route("/api/sesion/logout").post((_req, res) => {
      res.status(200).json({ message: "Auth module ready", mode: "logout" });
    });

    app.route("/api/sesion/perfil").get((_req, res) => {
      res.status(200).json({ message: "Auth module ready", mode: "perfil" });
    });
  }
}
