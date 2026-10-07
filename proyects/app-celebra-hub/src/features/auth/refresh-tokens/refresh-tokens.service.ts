import { randomUUID } from "node:crypto";
import { Transaction } from "sequelize";
import { AppError } from "../../../shared/errors/app-error";
import { withTransaction } from "../../../shared/database/with-transaction";
import { generateOpaqueToken, sha256Hex } from "../../../shared/auth/password";
import { RefreshToken } from "./refresh-token.model";
import { RefreshTokenResponseDto, toRefreshTokenResponse } from "./dto";
import { RefreshTokensRepository } from "./refresh-tokens.repository";

const configuredTtlDays = Number(process.env.JWT_REFRESH_TTL_DAYS ?? 7);
const REFRESH_TTL_DAYS = Number.isFinite(configuredTtlDays) && configuredTtlDays > 0
  ? configuredTtlDays
  : 7;

export interface IssuedSession {
  rawToken: string;
  familyId: string;
  expiresAt: Date;
}

export type RotationOutcome =
  | { kind: "rotated"; userId: number; rawToken: string; familyId: string; expiresAt: Date }
  | { kind: "invalid" }
  | { kind: "expired" }
  | { kind: "reuse"; familyId: string; revoked: number };

export class RefreshTokensService {
  public constructor(
    private readonly repository: RefreshTokensRepository = new RefreshTokensRepository()
  ) {}

  public async getAllMine(userId: number): Promise<RefreshTokenResponseDto[]> {
    const tokens = await this.repository.findAllByUser(userId);
    return tokens.map(toRefreshTokenResponse);
  }

  public async getMine(userId: number, id: number): Promise<RefreshTokenResponseDto> {
    return toRefreshTokenResponse(await this.findMineOrFail(userId, id));
  }

  public async revokeMine(userId: number, id: number): Promise<RefreshTokenResponseDto> {
    const token = await this.findMineOrFail(userId, id);
    await this.repository.update(token, { status: "inactive" });
    return toRefreshTokenResponse(token);
  }

  public async revokeAllMine(userId: number): Promise<number> {
    return this.repository.revokeAllByUser(userId);
  }

  public async purgeMine(userId: number): Promise<number> {
    return this.repository.purgeInactiveByUser(userId);
  }

  public async countActiveMine(userId: number): Promise<number> {
    return this.repository.countActiveByUser(userId);
  }

  public async issue(
    userId: number,
    deviceInfo: string | null,
    transaction?: Transaction
  ): Promise<IssuedSession> {
    const rawToken = generateOpaqueToken();
    const familyId = randomUUID();
    const expiresAt = expiryFromNow();

    await this.repository.create(
      {
        user_id: userId,
        token_hash: sha256Hex(rawToken),
        family_id: familyId,
        device_info: normalizeDeviceInfo(deviceInfo),
        expires_at: expiresAt,
        status: "active",
      },
      transaction
    );

    return { rawToken, familyId, expiresAt };
  }

  public async rotate(rawToken: string, deviceInfo: string | null): Promise<RotationOutcome> {
    const hash = sha256Hex(rawToken);

    return withTransaction<RotationOutcome>(async (transaction) => {
      const current = await this.repository.findByHash(hash, transaction, true);
      if (!current) return { kind: "invalid" };

      if (current.status !== "active") {
        const revoked = await this.repository.revokeFamily(current.family_id, transaction);
        return { kind: "reuse", familyId: current.family_id, revoked };
      }

      if (current.expires_at.getTime() <= Date.now()) {
        await this.repository.update(current, { status: "inactive" }, transaction);
        return { kind: "expired" };
      }

      await this.repository.update(current, { status: "inactive" }, transaction);
      const rawNext = generateOpaqueToken();
      const expiresAt = expiryFromNow();
      await this.repository.create(
        {
          user_id: current.user_id,
          token_hash: sha256Hex(rawNext),
          family_id: current.family_id,
          device_info: normalizeDeviceInfo(deviceInfo) ?? current.device_info,
          expires_at: expiresAt,
          status: "active",
        },
        transaction
      );

      return {
        kind: "rotated",
        userId: current.user_id,
        rawToken: rawNext,
        familyId: current.family_id,
        expiresAt,
      };
    });
  }

  public async revokeByToken(rawToken: string): Promise<boolean> {
    const token = await this.repository.findByHash(sha256Hex(rawToken));
    if (!token) return false;
    if (token.status === "active") {
      await this.repository.update(token, { status: "inactive" });
    }
    return true;
  }

  private async findMineOrFail(userId: number, id: number): Promise<RefreshToken> {
    const token = await this.repository.findById(id);
    if (!token || token.user_id !== userId) {
      throw new AppError(404, "Session not found");
    }
    return token;
  }
}

function expiryFromNow(): Date {
  return new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function normalizeDeviceInfo(deviceInfo: string | null): string | null {
  return deviceInfo?.slice(0, 500) ?? null;
}