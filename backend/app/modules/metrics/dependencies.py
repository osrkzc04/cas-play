from app.modules.auth.dependencies import require_roles


# Cada dashboard de métricas está limitado a su rol correspondiente.
require_admin = require_roles(["ADMIN"])
require_instructor = require_roles(["INSTRUCTOR"])
require_student = require_roles(["STUDENT"])
