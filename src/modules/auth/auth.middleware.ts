import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../shared/http/app-error";
import type { AuthUser, UserRole } from "./auth.types";
import { verifyAuthToken } from "./token";

const authUserKey = Symbol("authUser");

export type AuthenticatedRequest = Request & {
  [authUserKey]?: AuthUser;
};

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;
  const user = token ? verifyAuthToken(token) : null;

  if (!user) {
    next(new AppError("Authentication required", 401, "AUTH_REQUIRED"));
    return;
  }

  req[authUserKey] = user;
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const user = getAuthUser(req);

    if (!roles.includes(user.role)) {
      next(new AppError("You do not have permission to perform this action", 403, "FORBIDDEN"));
      return;
    }

    next();
  };
}

export function getAuthUser(req: Request): AuthUser {
  const user = (req as AuthenticatedRequest)[authUserKey];

  if (!user) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }

  return user;
}
