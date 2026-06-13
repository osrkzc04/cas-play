from app.modules.auth.dependencies import require_roles


# La consulta del registro de auditoría está limitada al rol ADMIN.
require_admin = require_roles(["ADMIN"])
