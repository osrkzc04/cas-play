from app.modules.auth.dependencies import require_roles


# La gestión de cursos está limitada a ADMIN e INSTRUCTOR.
require_course_manager = require_roles(["ADMIN", "INSTRUCTOR"])
