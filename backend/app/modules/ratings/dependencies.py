from app.modules.auth.dependencies import require_roles


# La valoración de cursos está limitada al rol STUDENT.
require_student = require_roles(["STUDENT"])
