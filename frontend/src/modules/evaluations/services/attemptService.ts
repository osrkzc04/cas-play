import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import type { AttemptAnswerInput, AttemptDetail, AttemptSummary } from "../types";

export const attemptService = {
  // Inicia o reanuda el intento en curso (el backend fija 10 preguntas).
  async start(evaluationId: string): Promise<AttemptDetail> {
    const { data } = await axiosClient.post<AttemptDetail>(
      endpoints.evaluations.attempts(evaluationId),
    );
    return data;
  },

  async listMine(evaluationId: string): Promise<AttemptSummary[]> {
    const { data } = await axiosClient.get<AttemptSummary[]>(
      endpoints.evaluations.attempts(evaluationId),
    );
    return data;
  },

  async submit(
    attemptId: string,
    answers: AttemptAnswerInput[],
  ): Promise<AttemptDetail> {
    const { data } = await axiosClient.post<AttemptDetail>(
      endpoints.evaluations.submitAttempt(attemptId),
      { answers },
    );
    return data;
  },

  async get(attemptId: string): Promise<AttemptDetail> {
    const { data } = await axiosClient.get<AttemptDetail>(
      endpoints.evaluations.attempt(attemptId),
    );
    return data;
  },
};
