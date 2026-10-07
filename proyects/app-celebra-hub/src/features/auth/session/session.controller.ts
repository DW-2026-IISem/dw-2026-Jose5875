import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { requireAuthUser } from "../../../shared/auth/auth-user";
import { SessionService } from "./session.service";
import { LoginDto, LogoutSessionDto, RefreshSessionDto } from "./dto";

export class SessionController extends BaseController {
  public constructor(private readonly service: SessionService = new SessionService()) {
    super();
  }

  public async login(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const result = await this.service.login(
        (req.body ?? {}) as LoginDto,
        req.get("user-agent") ?? null
      );
      res.status(200).json(result);
    });
  }

  public async refresh(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const result = await this.service.refresh(
        (req.body ?? {}) as RefreshSessionDto,
        req.get("user-agent") ?? null
      );
      res.status(200).json(result);
    });
  }

  public async logout(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      await this.service.logout((req.body ?? {}) as LogoutSessionDto);
      res.status(200).json({ message: "Session closed" });
    });
  }

  public async profile(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const user = await this.service.profile(requireAuthUser(req).id);
      res.status(200).json({ user });
    });
  }

  public async myPermissions(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const permissions = await this.service.myPermissions(requireAuthUser(req).id);
      res.status(200).json({ permissions });
    });
  }
}