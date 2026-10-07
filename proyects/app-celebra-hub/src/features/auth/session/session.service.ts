import { AppError } from "../../../shared/errors/app-error";
import { comparePassword } from "../../../shared/auth/password";
import { signAccessToken } from "../../../shared/auth/jwt";
import { UsersRepository } from "../users/users.repository";
import { RefreshTokensService } from "../refresh-tokens/refresh-tokens.service";

export interface SessionCredentials {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  refresh_expires_at: Date;
  user: { id: number; username: string; email: string };
}

export class SessionService {
  public constructor(
    private readonly usersRepository: UsersRepository = new UsersRepository(),
    private readonly refreshTokens: RefreshTokensService = new RefreshTokensService()
  ) {}

  public async login(
    identifier: unknown,
    password: unknown,
    deviceInfo: string | null
  ): Promise<SessionCredentials> {
    if (typeof identifier !== "string" || typeof password !== "string" || !password) {
      throw new AppError(400, "identifier and password are required");
    }

    const user = await this.usersRepository.findByIdentifierWithPassword(identifier);
    if (!user || user.status !== "active" || !(await comparePassword(password, user.password))) {
      throw new AppError(401, "Invalid credentials");
    }

    const access = signAccessToken({ id: user.id, usuario: user.username });
    const session = await this.refreshTokens.issue(user.id, deviceInfo);

    return {
      access_token: access.token,
      token_type: "Bearer",
      expires_in: access.expiresIn,
      refresh_token: session.rawToken,
      refresh_expires_at: session.expiresAt,
      user: { id: user.id, username: user.username, email: user.email },
    };
  }

  public async refresh(rawToken: unknown, deviceInfo: string | null): Promise<SessionCredentials> {
    if (typeof rawToken !== "string" || !rawToken) {
      throw new AppError(401, "Invalid or expired refresh token");
    }

    const outcome = await this.refreshTokens.rotate(rawToken, deviceInfo);
    if (outcome.kind !== "rotated") {
      throw new AppError(401, "Invalid or expired refresh token");
    }

    const user = await this.usersRepository.findByIdWithPassword(outcome.userId);
    if (!user || user.status !== "active") {
      await this.refreshTokens.revokeByToken(outcome.rawToken);
      throw new AppError(401, "Invalid or expired refresh token");
    }

    const access = signAccessToken({ id: user.id, usuario: user.username });
    return {
      access_token: access.token,
      token_type: "Bearer",
      expires_in: access.expiresIn,
      refresh_token: outcome.rawToken,
      refresh_expires_at: outcome.expiresAt,
      user: { id: user.id, username: user.username, email: user.email },
    };
  }

  public async logout(rawToken: unknown): Promise<boolean> {
    if (typeof rawToken !== "string" || !rawToken) return false;
    return this.refreshTokens.revokeByToken(rawToken);
  }
}