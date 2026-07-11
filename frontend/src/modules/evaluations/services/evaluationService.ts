import { AxiosError } from "axios";

import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import type {
  Evaluation,
  EvaluationDetail,
  EvaluationPayload,
  Question,
  QuestionPayload,
} from "../types";

export const evaluationService = {
  // El curso puede no tener evaluación final todavía; en ese caso el backend
  // responde 404 y lo traducimos a null para mostrar el estado "crear".
  async getByCourse(courseId: string): Promise<EvaluationDetail | null> {
    try {
      const { data } = await axiosClient.get<EvaluationDetail>(
        endpoints.evaluations.byCourse(courseId),
      );
      return data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async create(
    courseId: string,
    payload: EvaluationPayload,
  ): Promise<Evaluation> {
    const { data } = await axiosClient.post<Evaluation>(
      endpoints.evaluations.byCourse(courseId),
      payload,
    );
    return data;
  },

  async update(
    evaluationId: string,
    payload: EvaluationPayload,
  ): Promise<Evaluation> {
    const { data } = await axiosClient.patch<Evaluation>(
      endpoints.evaluations.update(evaluationId),
      payload,
    );
    return data;
  },

  async remove(evaluationId: string): Promise<void> {
    await axiosClient.delete(endpoints.evaluations.delete(evaluationId));
  },

  async addQuestion(
    evaluationId: string,
    payload: QuestionPayload,
  ): Promise<Question> {
    const { data } = await axiosClient.post<Question>(
      endpoints.evaluations.questions(evaluationId),
      payload,
    );
    return data;
  },

  async updateQuestion(
    questionId: string,
    payload: QuestionPayload,
  ): Promise<Question> {
    const { data } = await axiosClient.patch<Question>(
      endpoints.evaluations.updateQuestion(questionId),
      payload,
    );
    return data;
  },

  async deleteQuestion(questionId: string): Promise<void> {
    await axiosClient.delete(endpoints.evaluations.deleteQuestion(questionId));
  },
};
