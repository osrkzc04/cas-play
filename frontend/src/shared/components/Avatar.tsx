import { cn } from "@/shared/lib/cn";

interface AvatarProps {
  initials: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

export function Avatar({ initials, imageUrl, size = "md", className }: AvatarProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={cn(
          "rounded-full object-cover",
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700",
        sizeClasses[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
