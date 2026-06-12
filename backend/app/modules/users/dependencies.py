from app.modules.auth.dependencies import require_roles


# Todos los endpoints de gestión de usuarios y roles requieren ADMIN.
require_admin = require_roles(["ADMIN"])
