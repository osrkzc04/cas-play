import { useNavigate } from "react-router-dom";

import { Button } from "@/shared/components/Button";
import { useAuth } from "@/shared/auth/useAuth";
import { getInitials, roleLabels } from "@/shared/auth/roles";

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium text-slate-800">
          {user.first_name} {user.last_name}
        </p>
        <p className="text-xs text-slate-500">{roleLabels[user.role]}</p>
      </div>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
        {getInitials(user.first_name, user.last_name)}
      </span>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Salir
      </Button>
    </div>
  );
}
