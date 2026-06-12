import { AppError } from "../../shared/http/app-error";
import { AuthRepository } from "./auth.repository";
import type { AuthUser, LoginInput, UserRecord } from "./auth.types";
import { verifyPassword } from "./password";
import { createAuthToken } from "./token";

export interface AuthRepositoryPort {
  findByEmail(email: string): Promise<UserRecord | null>;
}

export class AuthService {
  constructor(private readonly repository: AuthRepositoryPort = new AuthRepository()) {}

  async login(input: LoginInput): Promise<{ user: AuthUser; token: string }> {
    const user = await this.repository.findByEmail(input.email);

    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return {
      user: authUser,
      token: createAuthToken(authUser),
    };
  }
}
