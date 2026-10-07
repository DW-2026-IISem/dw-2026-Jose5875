import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { sendError } from "../../../shared/http/error-response";
import { extractBearerToken, verifyAccessToken } from "../../../shared/auth/jwt";
import { AuthenticatedRequest } from "../../../shared/auth/auth-user";
import { isOperationGranted } from "../../../shared/auth/resource-match";
import { User } from "../users/user.model";
import { ResourceRolesService } from "../resource-roles/resource-roles.service";

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      throw new AppError(401, "Authentication required");
    }

    const payload = verifyAccessToken(token);
    const user = await User.findByPk(Number(payload.sub));
    if (!user || user.status !== "active") {
      throw new AppError(401, "Authentication required");
    }

    authReq.auth = {
      id: user.id,
      usuario: user.username,
      username: user.username,
      email: user.email,
    };

    next();
  } catch (error) {
    sendError(res, error);
  }
}

export async function authorize(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.auth) {
      throw new AppError(401, "Authentication required");
    }

    const service = new ResourceRolesService();
    const permissions = await service.findEffectiveForUser(authReq.auth.id);
    const granted = isOperationGranted(
      permissions,
      req.method,
      req.originalUrl.split("?")[0]
    );

    if (!granted) {
      throw new AppError(403, "Forbidden");
    }

    next();
  } catch (error) {
    sendError(res, error);
  }
}
