import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Alert, Button, Input, Select } from "@/shared/components";
import type { Question, QuestionPayload, QuestionType } from "../types";

const MAX_OPTIONS = 6;
const MIN_OPTIONS = 2;
const TF_OPTIONS = ["Verdadero", "Falso"];

interface QuestionFormProps {
  defaultValue?: Question;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (payload: QuestionPayload) => void;
  onCancel: () => void;
}

export function QuestionForm({
  defaultValue,
  isSubmitting = false,
  submitLabel = "Guardar",
  onSubmit,
  onCancel,
}: QuestionFormProps) {
  const [statement, setStatement] = useState(defaultValue?.statement ?? "");
  const [type, setType] = useState<QuestionType>(
    defaultValue?.question_type ?? "MULTIPLE_CHOICE",
  );
  const [options, setOptions] = useState<string[]>(
    defaultValue?.options.map((o) => o.text) ?? ["", ""],
  );
  const [correctIndex, setCorrectIndex] = useState<number>(
    Math.max(0, defaultValue?.options.findIndex((o) => o.is_correct) ?? 0),
  );
  const [error, setError] = useState<string | null>(null);

  const isTrueFalse = type === "TRUE_FALSE";
  const shownOptions = isTrueFalse ? TF_OPTIONS : options;

  const changeType = (next: QuestionType) => {
    setType(next);
    setCorrectIndex(0);
    if (next === "MULTIPLE_CHOICE") {
      setOptions(["", ""]);
    }
  };

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const addOption = () => {
    if (options.length < MAX_OPTIONS) {
      setOptions((prev) => [...prev, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) {
      return;
    }
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setCorrectIndex((prev) =>
      prev === index ? 0 : prev > index ? prev - 1 : prev,
    );
  };

  const handleSubmit = () => {
    if (!statement.trim()) {
      setError("Ingresa el enunciado de la pregunta.");
      return;
    }
    if (!isTrueFalse && shownOptions.some((o) => !o.trim())) {
      setError("Todas las opciones deben tener texto.");
      return;
    }
    setError(null);
    onSubmit({
      statement: statement.trim(),
      question_type: type,
      options: shownOptions.map((text, i) => ({
        text: text.trim(),
        is_correct: i === correctIndex,
      })),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="statement" className="text-sm font-medium text-gray-700">
          Enunciado
        </label>
        <textarea
          id="statement"
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          className="min-h-[80px] rounded-lg border border-gray-300 bg-card px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          placeholder="Escribe la pregunta"
        />
      </div>

      <Select
        label="Tipo de pregunta"
        options={[
          { value: "MULTIPLE_CHOICE", label: "Opción múltiple" },
          { value: "TRUE_FALSE", label: "Verdadero / Falso" },
        ]}
        value={type}
        onChange={(e) => changeType(e.target.value as QuestionType)}
      />

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-700">
          Opciones (marca la correcta)
        </p>
        {shownOptions.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct-option"
              checked={correctIndex === index}
              onChange={() => setCorrectIndex(index)}
              className="h-4 w-4 text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600"
              aria-label={`Marcar opción ${index + 1} como correcta`}
            />
            <div className="flex-1">
              <Input
                value={option}
                disabled={isTrueFalse}
                placeholder={`Opción ${index + 1}`}
                onChange={(e) => updateOption(index, e.target.value)}
              />
            </div>
            {!isTrueFalse && options.length > MIN_OPTIONS && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeOption(index)}
                aria-label="Quitar opción"
              >
                <Trash2 className="h-4 w-4 text-brand-600" />
              </Button>
            )}
          </div>
        ))}
        {!isTrueFalse && options.length < MAX_OPTIONS && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={addOption}
          >
            <Plus className="h-4 w-4" />
            Agregar opción
          </Button>
        )}
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" isLoading={isSubmitting} onClick={handleSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
