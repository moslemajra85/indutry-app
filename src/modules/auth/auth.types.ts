export type UserRole = "admin" | "supervisor" | "line_leader" | "quality" | "maintenance" | "viewer";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface UserRecord extends AuthUser {
  passwordHash: string;
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
