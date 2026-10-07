import { Request } from "express";
import { AppError } from "../errors/app-error";

export interface AuthUser {
  id: number;
  usuario?: string;
  username?: string;
  email?: string;
  tokenId?: string;
}

export type AuthenticatedRequest = Request & { auth?: AuthUser };

export function requireAuthUser(req: Request): AuthUser {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth) {
    throw new AppError(401, "Authentication required");
  }
  return authReq.auth;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export {};
