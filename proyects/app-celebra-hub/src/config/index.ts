import dotenv from "dotenv";
import express, { Application, ErrorRequestHandler } from "express";
import morgan from "morgan";
import cors from "cors";

dotenv.config();

export class App {
  public app: Application;

  constructor(private port?: number | string) {
    this.app = express();

    this.settings();
    this.middlewares();
    this.routes();
    this.errorHandling();
  }

  private settings(): void {
    this.app.set("port", this.port || process.env.PORT || 4000);
  }

  private middlewares(): void {
    this.app.use(morgan("dev"));
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
  }

  private routes(): void {
    this.app.get("/", (_req, res) => {
      res.json({
        message: "API funcionando correctamente",
      });
    });
  }

  private errorHandling(): void {
    const bodyErrorHandler: ErrorRequestHandler = (
      err,
      _req,
      res,
      next
    ) => {
      if (err instanceof SyntaxError && "body" in err) {
        res.status(400).json({
          error: "Malformed JSON body",
        });
        return;
      }

      next(err);
    };

    this.app.use(bodyErrorHandler);
  }

  async listen(): Promise<void> {
    await this.app.listen(this.app.get("port"));

    console.log(
      `🚀 Servidor ejecutándose en puerto ${this.app.get("port")}`
    );
  }
}