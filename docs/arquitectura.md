# Arquitectura Objetivo

src/

config/

models/

migrations/

controllers/

services/

routes/

middlewares/

validators/

## Principio Fundamental

Routes → Controllers → Services → Models

Los Controllers no contienen lógica.

Los Services contienen todas las reglas de negocio.

Los Models representan entidades de base de datos.

Los Middlewares manejan autenticación, autorización y errores.

Los Validators validan requests.

Las operaciones que afecten inventario deben ejecutarse mediante transacciones Sequelize.
