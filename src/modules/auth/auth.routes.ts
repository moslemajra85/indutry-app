import { Router } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import { AuthService } from "./auth.service";
import { getAuthUser, requireAuth } from "./auth.middleware";
import { loginSchema } from "./auth.validation";

export const authRouter = Router();
const service = new AuthService();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    res.json({ data: await service.login(input) });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ data: getAuthUser(req) });
  }),
);
