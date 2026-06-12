from app.modules.auth.dependencies import require_roles


# La gestión del banco de preguntas está limitada a ADMIN e INSTRUCTOR.
require_course_manager = require_roles(["ADMIN", "INSTRUCTOR"])

# Rendir evaluaciones está limitado al rol STUDENT.
require_student = require_roles(["STUDENT"])
