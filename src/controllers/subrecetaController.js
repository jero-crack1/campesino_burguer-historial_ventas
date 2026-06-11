const asyncHandler = require('../utils/asyncHandler');
const { success, list } = require('../utils/response');
const { validate, validateProduccion } = require('../validators/subrecetaValidator');
const service = require('../services/subrecetaService');

const getAll = asyncHandler(async (req, res) => {
  const data = await service.getAll();
  list(res, data);
});

const getById = asyncHandler(async (req, res) => {
  const data = await service.getById(req.params.id);
  success(res, data);
});

const create = asyncHandler(async (req, res) => {
  const { valid, errors } = validate(req.body);
  if (!valid) {
    return res.status(400).json({ ok: false, error: 'Datos inválidos', details: errors });
  }
  const data = await service.create(req.body);
  success(res, data, 201);
});

const update = asyncHandler(async (req, res) => {
  const { valid, errors } = validate(req.body, true);
  if (!valid) {
    return res.status(400).json({ ok: false, error: 'Datos inválidos', details: errors });
  }
  const data = await service.update(req.params.id, req.body);
  success(res, data);
});

const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.status(204).send();
});

const producir = asyncHandler(async (req, res) => {
  const { valid, errors } = validateProduccion(req.body);
  if (!valid) {
    return res.status(400).json({ ok: false, error: 'Datos inválidos', details: errors });
  }
  const data = await service.producir(req.params.id, req.body.cantidad_producir);
  success(res, data);
});

module.exports = { getAll, getById, create, update, remove, producir };
