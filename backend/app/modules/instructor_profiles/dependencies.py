from app.modules.auth.dependencies import require_roles


# El perfil solo lo gestiona su propio instructor; ADMIN no posee perfil docente.
require_instructor = require_roles(["INSTRUCTOR"])
