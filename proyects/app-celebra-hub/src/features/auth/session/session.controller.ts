import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { requireAuthUser } from "../../../shared/auth/auth-user";
import { SessionService } from "./session.service";

export class SessionController extends BaseController {
  public constructor(private readonly service: SessionService = new SessionService()) {
    super();
  }

  public async login(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const result = await this.service.login(
        req.body?.identifier,
        req.body?.password,
        req.get("user-agent") ?? null
      );
      res.status(200).json(result);
    });
  }

  public async refresh(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const result = await this.service.refresh(
        req.body?.refresh_token,
        req.get("user-agent") ?? null
      );
      res.status(200).json(result);
    });
  }

  public async logout(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const revoked = await this.service.logout(req.body?.refresh_token);
      res.status(200).json({ message: "Logged out", revoked });
    });
  }

  public async profile(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const user = requireAuthUser(req);
      res.status(200).json({ user: { id: user.id, username: user.username, email: user.email } });
    });
  }
}