import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const textAreaId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={textAreaId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <textarea
          id={textAreaId}
          ref={ref}
          aria-invalid={Boolean(error)}
          className={cn(
            "min-h-[120px] rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500",
            error ? "border-red-400" : "border-slate-300",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);

TextArea.displayName = "TextArea";
