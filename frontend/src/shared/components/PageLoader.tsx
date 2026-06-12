import { Spinner } from "./Spinner";

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-brand-600">
      <Spinner size="lg" />
    </div>
  );
}
