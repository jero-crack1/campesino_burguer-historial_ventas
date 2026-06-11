const asyncHandler = require('../utils/asyncHandler');
const { success, list } = require('../utils/response');
const { validate } = require('../validators/compraValidator');
const service = require('../services/compraService');

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

module.exports = { getAll, getById, create };
