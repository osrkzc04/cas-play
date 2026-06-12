import { useMutation } from "@tanstack/react-query";

import { authService } from "../services/authService";

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: authService.requestPasswordReset,
  });
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: authService.confirmPasswordReset,
  });
}
