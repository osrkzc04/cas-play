workspace "CAS Play" "Arquitectura completa de la Plataforma de Aprendizaje en Línea" {

    model {
        usuario = person "Usuario" {
            description "Administrador, instructor, estudiante o visitante."
        }

        administrador = person "Administrador" {
            description "Gestiona usuarios, cursos, matrículas, certificados y auditoría."
            tags "Administrador"
        }

        instructor = person "Instructor" {
            description "Crea, administra y publica cursos."
            tags "Instructor"
        }

        estudiante = person "Estudiante" {
            description "Accede a cursos, evaluaciones y certificados."
            tags "Estudiante"
        }

        casPlay = softwareSystem "CAS Play" {
            description "Plataforma de aprendizaje en línea de Culinary Arts School."

            frontend = container "Aplicación web" {
                description "Interfaz para administradores, instructores, estudiantes y visitantes."
                technology "React"
                tags "AplicacionWeb"
            }

            backend = container "API REST" {
                description "Implementa la lógica de negocio y expone los servicios de la plataforma."
                technology "FastAPI"
                tags "API"

                authController = component "Inicio de sesión" {
                    description "Recibe las credenciales y coordina el proceso de autenticación."
                    technology "FastAPI"
                    tags "Seguridad"
                }

                credentialService = component "Validación de credenciales" {
                    description "Verifica el usuario, la contraseña y el estado de la cuenta."
                    technology "Python / bcrypt"
                    tags "Seguridad"
                }

                tokenService = component "Generación de JWT" {
                    description "Genera y valida tokens de acceso y de renovación."
                    technology "JWT"
                    tags "Seguridad"
                }

                accessControl = component "Control de acceso" {
                    description "Autoriza las operaciones de acuerdo con el rol del usuario."
                    technology "RBAC"
                    tags "Seguridad"
                }

                passwordRecovery = component "Recuperación de contraseña" {
                    description "Gestiona tokens temporales, cambio de contraseña e invalidación de sesiones."
                    technology "FastAPI"
                    tags "Recuperacion"
                }

                auditService = component "Registro de auditoría" {
                    description "Registra eventos relevantes con usuario, acción, fecha y hora."
                    technology "Python"
                    tags "Auditoria"
                }

                certificateService = component "Emisión de certificados" {
                    description "Genera certificados digitales con código único y código QR."
                    technology "FastAPI"
                    tags "Certificados"
                }

                certificateValidation = component "Validación pública de certificados" {
                    description "Comprueba la autenticidad de un certificado sin iniciar sesión."
                    technology "FastAPI"
                    tags "Certificados"
                }
            }

            database = container "Base de datos" {
                description "Almacena información académica, administrativa, de seguridad y auditoría."
                technology "PostgreSQL"
                tags "BaseDatos"
            }

            emailService = container "Servicio de correo" {
                description "Envía enlaces seguros para la recuperación de contraseña."
                technology "SMTP"
                tags "Correo"
            }
        }

        usuario -> frontend "Accede mediante navegador"
        administrador -> frontend "Administra la plataforma"
        instructor -> frontend "Gestiona cursos"
        estudiante -> frontend "Accede a cursos, evaluaciones y certificados"

        frontend -> backend "Consume servicios" "HTTPS / JSON"
        backend -> database "Lee y escribe datos" "SQL"

        frontend -> authController "Envía credenciales" "HTTPS / JSON"
        authController -> credentialService "Solicita validación"
        credentialService -> database "Consulta usuario y contraseña" "SQL"
        credentialService -> tokenService "Confirma credenciales válidas"
        tokenService -> accessControl "Entrega identidad y roles"
        accessControl -> frontend "Autoriza el acceso según el rol"

        frontend -> passwordRecovery "Solicita recuperación" "HTTPS / JSON"
        passwordRecovery -> database "Registra token y actualiza contraseña" "SQL"
        passwordRecovery -> emailService "Envía enlace seguro" "SMTP"
        passwordRecovery -> tokenService "Invalida sesiones activas"

        authController -> auditService "Registra inicio de sesión"
        accessControl -> auditService "Registra accesos relevantes"
        certificateService -> auditService "Registra emisión"
        auditService -> database "Almacena eventos" "SQL"

        frontend -> certificateService "Solicita certificado" "HTTPS / JSON"
        certificateService -> database "Verifica requisitos y registra certificado" "SQL"
        certificateService -> frontend "Entrega certificado con código y QR"
        frontend -> certificateValidation "Consulta código único" "HTTPS / JSON"
        certificateValidation -> database "Consulta certificado" "SQL"
        certificateValidation -> frontend "Devuelve resultado de validación"

        produccion = deploymentEnvironment "Producción" {

            repositorio = deploymentNode "Repositorio Git" {
                description "Repositorio de código fuente."
                technology "Git"
                tags "RepositorioGit"
            }

            servidorLinux = deploymentNode "Servidor Linux" {
                description "Servidor que hospeda la plataforma."
                technology "Linux"
                tags "ServidorLinux"

                docker = deploymentNode "Docker" {
                    description "Entorno de ejecución de los contenedores."
                    technology "Docker"
                    tags "Docker"

                    dokploy = infrastructureNode "Dokploy" {
                        description "Orquesta, publica y actualiza los servicios."
                        technology "Dokploy"
                        tags "Dokploy"
                    }

                    frontendProd = containerInstance frontend {
                        tags "ContenedorFrontend"
                    }

                    backendProd = containerInstance backend {
                        tags "ContenedorBackend"
                    }

                    databaseProd = containerInstance database {
                        tags "ContenedorBaseDatos"
                    }

                    volumen = infrastructureNode "Volumen persistente" {
                        description "Conserva videos, materiales de apoyo y certificados."
                        technology "Docker Volume"
                        tags "VolumenPersistente"
                    }
                }
            }
        }

        repositorio -> dokploy "Inicia despliegue automático" "Git push / CI-CD"
        dokploy -> frontendProd "Publica y actualiza"
        dokploy -> backendProd "Publica y actualiza"
        dokploy -> databaseProd "Administra"
        backendProd -> volumen "Almacena y recupera archivos"
    }

    views {
        container casPlay "ArquitecturaClienteServidor" {
            title "Arquitectura Cliente-Servidor"
            include usuario
            include frontend
            include backend
            include database
            autoLayout lr
        }

        deployment casPlay "Producción" "ArquitecturaDespliegue" {
            title "Arquitectura de Despliegue"
            include *
            autoLayout tb
        }

        component backend "SeguridadControlAcceso" {
            title "Seguridad y Control de Acceso"
            include usuario
            include administrador
            include instructor
            include estudiante
            include frontend
            include authController
            include credentialService
            include tokenService
            include accessControl
            include passwordRecovery
            include auditService
            include certificateService
            include certificateValidation
            include database
            include emailService
            autoLayout lr
        }

        styles {
            element "Element" {
                background #F2F2F2
                color #1F1F1F
                stroke #7F7F7F
                strokeWidth 2
                fontSize 24
                opacity 100
            }

            element "Person" {
                shape Person
                background #F2F2F2
                color #1F1F1F
                stroke #595959
                strokeWidth 2
                fontSize 24
            }

            element "Administrador" {
                background #E7E6E6
            }

            element "Instructor" {
                background #E7E6E6
            }

            element "Estudiante" {
                background #E7E6E6
            }

            element "Software System" {
                background #FFFFFF
                color #1F1F1F
                stroke #7F7F7F
                strokeWidth 2
                fontSize 28
            }

            element "AplicacionWeb" {
                shape WebBrowser
                background #E7E6E6
                color #1F1F1F
                stroke #595959
                strokeWidth 2
                fontSize 24
            }

            element "API" {
                shape Box
                background #E7E6E6
                color #1F1F1F
                stroke #595959
                strokeWidth 2
                fontSize 24
            }

            element "BaseDatos" {
                shape Cylinder
                background #E7E6E6
                color #1F1F1F
                stroke #595959
                strokeWidth 2
                fontSize 24
            }

            element "Seguridad" {
                shape Box
                background #E7E6E6
                color #1F1F1F
                stroke #404040
                strokeWidth 2
                fontSize 22
            }

            element "Recuperacion" {
                shape Box
                background #F2F2F2
                color #1F1F1F
                stroke #595959
                strokeWidth 2
                fontSize 22
            }

            element "Auditoria" {
                shape Box
                background #F2F2F2
                color #1F1F1F
                stroke #595959
                strokeWidth 2
                fontSize 22
            }

            element "Certificados" {
                shape Box
                background #F2F2F2
                color #1F1F1F
                stroke #595959
                strokeWidth 2
                fontSize 22
            }

            element "Correo" {
                shape Box
                background #F2F2F2
                color #1F1F1F
                stroke #595959
                strokeWidth 2
                fontSize 22
            }

            element "Deployment Node" {
                background #FFFFFF
                color #1F1F1F
                stroke #7F7F7F
                strokeWidth 2
                fontSize 26
            }

            element "Infrastructure Node" {
                background #F2F2F2
                color #1F1F1F
                stroke #7F7F7F
                strokeWidth 2
                fontSize 22
            }

            element "RepositorioGit" {
                shape Folder
                background #F2F2F2
                color #1F1F1F
                stroke #595959
                strokeWidth 2
                fontSize 22
            }

            element "ServidorLinux" {
                background #FFFFFF
                color #1F1F1F
                stroke #404040
                strokeWidth 3
                fontSize 28
            }

            element "Docker" {
                background #F7F7F7
                color #1F1F1F
                stroke #7F7F7F
                strokeWidth 2
                fontSize 25
            }

            element "Dokploy" {
                shape Hexagon
                background #E7E6E6
                color #1F1F1F
                stroke #595959
                strokeWidth 2
                fontSize 22
            }

            element "ContenedorFrontend" {
                shape WebBrowser
                background #E7E6E6
                color #1F1F1F
                stroke #595959
                strokeWidth 2
                fontSize 22
            }

            element "ContenedorBackend" {
                shape Box
                background #E7E6E6
                color #1F1F1F
                stroke #595959
                strokeWidth 2
                fontSize 22
            }

            element "ContenedorBaseDatos" {
                shape Cylinder
                background #E7E6E6
                color #1F1F1F
                stroke #595959
                strokeWidth 2
                fontSize 22
            }

            element "VolumenPersistente" {
                shape Folder
                background #F2F2F2
                color #1F1F1F
                stroke #595959
                strokeWidth 2
                fontSize 22
            }

            relationship "Relationship" {
                color #404040
                thickness 2
                style Solid
                routing Direct
                fontSize 20
            }
        }

        properties {
            "structurizr.title" "false"
            "structurizr.description" "false"
            "structurizr.metadata" "false"
        }
    }
}
