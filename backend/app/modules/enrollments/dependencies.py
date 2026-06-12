from app.modules.auth.dependencies import require_roles


# La matrícula y la consulta de cursos propios están limitadas al rol STUDENT.
require_student = require_roles(["STUDENT"])
