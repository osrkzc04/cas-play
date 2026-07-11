import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/components";
import type { AnswerResult, QuestionPublic } from "../types";

interface AttemptQuestionCardProps {
  index: number;
  question: QuestionPublic;
  selectedOptionId: string | null;
  // En modo resultado las opciones quedan bloqueadas y se resalta lo correcto.
  result?: AnswerResult;
  onSelect?: (optionId: string) => void;
}

export function AttemptQuestionCard({
  index,
  question,
  selectedOptionId,
  result,
  onSelect,
}: AttemptQuestionCardProps) {
  const isReview = Boolean(result);

  return (
    <Card className="space-y-3 p-5">
      <p className="font-medium text-gray-900">
        {index + 1}. {question.statement}
      </p>
      <div className="space-y-2">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect = result?.correct_option_id === option.id;
          const isWrongChoice =
            isReview && isSelected && !isCorrect;

          return (
            <label
              key={option.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2 text-sm transition",
                isReview && isCorrect && "border-green-500 bg-green-50",
                isWrongChoice && "border-brand-500 bg-brand-50",
                !isReview && isSelected && "border-brand-500 bg-brand-50",
                !isReview && !isSelected && "border-gray-200 hover:bg-gray-50",
                isReview && !isCorrect && !isWrongChoice && "border-gray-200",
                isReview && "cursor-default",
              )}
            >
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={isSelected}
                disabled={isReview}
                onChange={() => onSelect?.(option.id)}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="text-gray-700">{option.text}</span>
            </label>
          );
        })}
      </div>
    </Card>
  );
}
