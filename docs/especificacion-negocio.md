DESARROLLO DE API REST PARA INVENTARIO Y PRODUCCIÓN DE ALIMENTOS

Actúa como Arquitecto de Software Senior especializado en Node.js, Express.js, Sequelize ORM y MySQL.

Necesito desarrollar una API REST completa para gestión de inventario, producción y ventas de productos alimenticios.

El proyecto debe implementar arquitectura por capas:

* Routes
* Controllers
* Services
* Models
* Migrations
* Middlewares
* Validations

Utilizar:

* Node.js
* Express.js
* Sequelize ORM
* MySQL

Seguir principios SOLID y separación de responsabilidades.

⸻

OBJETIVO DEL SISTEMA

Administrar el siguiente flujo:

COMPRAS
↓
MATERIAS PRIMAS
↓
SUBRECETAS
↓
RECETAS
↓
VENTAS

⸻

REGLAS GENERALES

El sistema debe manejar inventario real.

Las compras incrementan stock.

Las producciones descuentan stock.

Las ventas descuentan productos terminados.

La creación de recetas y subrecetas NO debe afectar inventario.

Las recetas y subrecetas representan fórmulas o composiciones.

El inventario solo cambia mediante:

* Compras
* Producción de Subrecetas
* Producción de Recetas
* Ventas

⸻

UNIDADES DE MEDIDA

El sistema debe manejar únicamente las siguientes unidades:

* kg
* g
* L
* ml
* cda
* und

Implementar mediante ENUM.

No se deben permitir otras unidades.

⸻

MÓDULO MATERIAS PRIMAS

Las materias primas representan ingredientes básicos.

Ejemplos:

* Carne Molida
* Harina
* Sal
* Agua
* Queso
* Aceite

CRUD COMPLETO

Debe permitir:

Crear materia prima

Registrar:

* nombre
* descripción
* unidad_medida
* stock_actual
* stock_minimo
* costo_unitario

Consultar materias primas

* Listar todas
* Buscar por id

Editar materia prima

Debe permitir modificar:

* nombre
* descripción
* unidad_medida
* stock_actual
* stock_minimo
* costo_unitario

Eliminar materia prima

Eliminar registro si no existen restricciones de integridad.

⸻

TABLA MATERIAS_PRIMAS

id

nombre

descripcion

unidad_medida ENUM(‘kg’,‘g’,‘L’,‘ml’,‘cda’,‘und’)

stock_actual

stock_minimo

costo_unitario

createdAt

updatedAt

⸻

MÓDULO COMPRAS

Registrar compras de materias primas.

TABLA COMPRAS

id

fecha

proveedor

total

observaciones

createdAt

updatedAt

⸻

TABLA DETALLE_COMPRAS

id

compra_id

materia_prima_id

cantidad

precio_unitario

subtotal

createdAt

updatedAt

⸻

LÓGICA

Al crear una compra:

1. Crear compra.
2. Crear detalles.
3. Aumentar stock de cada materia prima.

⸻

MÓDULO SUBRECETAS

Las subrecetas son preparaciones intermedias.

Ejemplos:

* Carne Hamburguesa
* Salsa BBQ
* Masa Pizza

Las subrecetas tienen inventario propio.

⸻

CRUD COMPLETO DE SUBRECETAS

Crear Subreceta

Registrar:

* nombre
* descripción
* unidad_medida
* stock_actual inicial

Adicionalmente permitir agregar múltiples materias primas.

Ejemplo:

Subreceta:

Carne Hamburguesa

Ingredientes:

* Carne Molida → 100 g
* Sal → 10 g
* Salsa Inglesa → 2 cda

Debe guardarse toda la composición.

⸻

Consultar Subreceta

Mostrar:

Datos de la subreceta.

Lista de materias primas asociadas.

Cantidades utilizadas.

⸻

Editar Subreceta

Debe permitir:

Modificar:

* nombre
* descripción
* unidad_medida
* stock_actual

Agregar nuevas materias primas.

Eliminar materias primas.

Modificar cantidades.

Ejemplo:

Cambiar:

10 g sal

por

15 g sal

sin necesidad de recrear la subreceta.

⸻

Eliminar Subreceta

Eliminar completamente.

⸻

TABLA SUBRECETAS

id

nombre

descripcion

unidad_medida

stock_actual

costo_produccion

createdAt

updatedAt

⸻

TABLA SUBRECETA_MATERIAS_PRIMAS

id

subreceta_id

materia_prima_id

cantidad

createdAt

updatedAt

⸻

PRODUCCIÓN DE SUBRECETAS

Endpoint:

POST /subrecetas/:id/producir

Recibe:

cantidad_producir

Proceso:

1. Leer composición.
2. Validar stock de materias primas.
3. Descontar materias primas.
4. Incrementar stock de la subreceta.
5. Ejecutar todo dentro de transacción Sequelize.

⸻

MÓDULO RECETAS

Representan productos finales.

Ejemplos:

* Hamburguesa Especial
* Pizza BBQ
* Pizza Hawaiana

⸻

CRUD COMPLETO DE RECETAS

Crear Receta

Registrar:

* nombre
* descripción
* precio_venta
* unidad_medida
* stock_actual

Debe permitir agregar:

Subrecetas.

Materias primas directas.

⸻

Ejemplo

Hamburguesa Especial

Subrecetas:

* 1 Carne Hamburguesa

Materias Primas:

* 1 Pan
* 20 g Queso
* 10 ml Salsa

Guardar toda la composición.

⸻

Consultar Receta

Mostrar:

Datos generales.

Subrecetas utilizadas.

Materias primas utilizadas.

Cantidades.

⸻

Editar Receta

Debe permitir:

Modificar:

* nombre
* descripción
* precio_venta
* unidad_medida
* stock_actual

Agregar componentes.

Eliminar componentes.

Modificar cantidades.

⸻

Eliminar Receta

Eliminar completamente.

⸻

TABLA RECETAS

id

nombre

descripcion

precio_venta

unidad_medida

stock_actual

costo_produccion

createdAt

updatedAt

⸻

TABLA RECETA_SUBRECETAS

id

receta_id

subreceta_id

cantidad

createdAt

updatedAt

⸻

TABLA RECETA_MATERIAS_PRIMAS

id

receta_id

materia_prima_id

cantidad

createdAt

updatedAt

⸻

PRODUCCIÓN DE RECETAS

Endpoint:

POST /recetas/:id/producir

Proceso:

1. Leer fórmula.
2. Validar stock de subrecetas.
3. Validar stock de materias primas.
4. Descontar insumos.
5. Incrementar stock de receta.
6. Ejecutar dentro de transacción.

⸻

MÓDULO VENTAS

⸻

TABLA VENTAS

id

fecha

cliente

total

createdAt

updatedAt

⸻

TABLA DETALLE_VENTAS

id

venta_id

receta_id

cantidad

precio_unitario

subtotal

createdAt

updatedAt

⸻

LÓGICA DE VENTA

Al registrar una venta:

1. Crear venta.
2. Crear detalles.
3. Validar stock de recetas.
4. Descontar stock de recetas.
5. Calcular total.

⸻

RELACIONES

Compra 1:N DetalleCompra

MateriaPrima 1:N DetalleCompra

SubReceta N:N MateriaPrima

Receta N:N SubReceta

Receta N:N MateriaPrima

Venta 1:N DetalleVenta

Receta 1:N DetalleVenta

⸻

ESTRUCTURA DEL PROYECTO

src/

config/

database.js

models/

MateriaPrima.js

Compra.js

DetalleCompra.js

SubReceta.js

SubRecetaMateriaPrima.js

Receta.js

RecetaSubReceta.js

RecetaMateriaPrima.js

Venta.js

DetalleVenta.js

controllers/

materiaPrimaController.js

compraController.js

subrecetaController.js

recetaController.js

ventaController.js

services/

inventarioService.js

compraService.js

subrecetaService.js

produccionSubrecetaService.js

recetaService.js

produccionRecetaService.js

ventaService.js

routes/

materiasPrimas.routes.js

compras.routes.js

subrecetas.routes.js

recetas.routes.js

ventas.routes.js

middlewares/

errorHandler.js

validators/

app.js

⸻

ENDPOINTS REST

Materias Primas

GET /materias-primas

GET /materias-primas/:id

POST /materias-primas

PUT /materias-primas/:id

DELETE /materias-primas/:id

⸻

Compras

GET /compras

GET /compras/:id

POST /compras

⸻

Subrecetas

GET /subrecetas

GET /subrecetas/:id

POST /subrecetas

PUT /subrecetas/:id

DELETE /subrecetas/:id

POST /subrecetas/:id/producir

⸻

Recetas

GET /recetas

GET /recetas/:id

POST /recetas

PUT /recetas/:id

DELETE /recetas/:id

POST /recetas/:id/producir

⸻

Ventas

GET /ventas

GET /ventas/:id

POST /ventas

⸻

REQUERIMIENTO IMPORTANTE

Toda la lógica de negocio debe estar en Services.

Los Controllers únicamente deben recibir requests y retornar responses.

Implementar asociaciones Sequelize, validaciones, manejo de errores, transacciones y documentación clara del código.