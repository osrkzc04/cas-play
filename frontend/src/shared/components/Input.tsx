import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";
import { FieldError } from "./FieldError";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-11 rounded-lg border bg-card px-3 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
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

Input.displayName = "Input";
