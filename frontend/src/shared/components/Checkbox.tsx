import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <label
        htmlFor={inputId}
        className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700"
      >
        <input
          id={inputId}
          ref={ref}
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border-gray-300 text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
            className,
          )}
          {...props}
        />
        <span>{label}</span>
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
