from app.modules.auth.dependencies import require_roles


# El registro y la consulta de progreso están limitados al rol STUDENT.
require_student = require_roles(["STUDENT"])
