import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";
import { FieldError } from "./FieldError";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const textAreaId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textAreaId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <textarea
          id={textAreaId}
          ref={ref}
          aria-invalid={Boolean(error)}
          className={cn(
            "min-h-[120px] rounded-lg border bg-card px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
            error ? "border-brand-600" : "border-gray-300",
            className,
          )}
          {...props}
        />
        <FieldError message={error} />
      </div>
    );
  },
);

TextArea.displayName = "TextArea";
