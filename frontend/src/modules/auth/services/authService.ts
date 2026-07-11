import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import type {
  PasswordResetConfirmValues,
  PasswordResetRequestValues,
} from "../schemas/authSchemas";

interface MessageResponse {
  message: string;
}

interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export const authService = {
  async requestPasswordReset(
    payload: PasswordResetRequestValues,
  ): Promise<MessageResponse> {
    const { data } = await axiosClient.post<MessageResponse>(
      endpoints.auth.passwordResetRequest,
      payload,
    );
    return data;
  },

  async confirmPasswordReset(
    payload: PasswordResetConfirmValues,
  ): Promise<MessageResponse> {
    const { data } = await axiosClient.post<MessageResponse>(
      endpoints.auth.passwordResetConfirm,
      payload,
    );
    return data;
  },

  async changePassword(
    payload: ChangePasswordPayload,
  ): Promise<MessageResponse> {
    const { data } = await axiosClient.post<MessageResponse>(
      endpoints.auth.changePassword,
      payload,
    );
    return data;
  },
};
