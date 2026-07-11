import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import { Avatar } from "@/shared/components/Avatar";
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
        <p className="text-sm font-medium text-gray-800">
          {user.first_name} {user.last_name}
        </p>
        <p className="text-xs text-gray-500">{roleLabels[user.role]}</p>
      </div>
      <Avatar initials={getInitials(user.first_name, user.last_name)} />
      <Button
        variant="secondary"
        size="sm"
        onClick={handleLogout}
        aria-label="Salir"
        title="Salir"
        className="w-9 px-0"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
