import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import type {
  CreateUserPayload,
  ManagedUser,
  UpdateUserPayload,
  UserRole,
} from "../types";

interface ListParams {
  skip: number;
  limit: number;
}

export const userService = {
  async list(params: ListParams): Promise<ManagedUser[]> {
    const { data } = await axiosClient.get<ManagedUser[]>(
      endpoints.users.list,
      { params },
    );
    return data;
  },

  async getById(id: string): Promise<ManagedUser> {
    const { data } = await axiosClient.get<ManagedUser>(
      endpoints.users.detail(id),
    );
    return data;
  },

  async create(payload: CreateUserPayload): Promise<ManagedUser> {
    const { data } = await axiosClient.post<ManagedUser>(
      endpoints.users.create,
      payload,
    );
    return data;
  },

  async update(id: string, payload: UpdateUserPayload): Promise<ManagedUser> {
    const { data } = await axiosClient.patch<ManagedUser>(
      endpoints.users.update(id),
      payload,
    );
    return data;
  },

  async resetPassword(id: string): Promise<ManagedUser> {
    const { data } = await axiosClient.post<ManagedUser>(
      endpoints.users.resetPassword(id),
    );
    return data;
  },

  async getRoles(): Promise<UserRole[]> {
    const { data } = await axiosClient.get<UserRole[]>(endpoints.users.roles);
    return data;
  },
};
