import { Outlet } from "react-router-dom";

import { Brand } from "./Brand";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-12">
      <div className="mb-8">
        <Brand />
      </div>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
