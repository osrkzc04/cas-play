from app.modules.auth.dependencies import require_roles


# La gestión y emisión de certificados está limitada al rol STUDENT.
require_student = require_roles(["STUDENT"])
