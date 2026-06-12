import { Link } from "react-router-dom";

import { cn } from "@/shared/lib/cn";

interface BrandProps {
  to?: string;
  className?: string;
}

export function Brand({ to = "/", className }: BrandProps) {
  return (
    <Link to={to} className={cn("flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
        C
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-900">
        Culinary Arts School
      </span>
    </Link>
  );
}
