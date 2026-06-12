export type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  is_verified: boolean;
}
