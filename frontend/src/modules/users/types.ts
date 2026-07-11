export interface UserRole {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManagedUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  role_id?: string;
  is_active?: boolean;
  is_verified?: boolean;
}
