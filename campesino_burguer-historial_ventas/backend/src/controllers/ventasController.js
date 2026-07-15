const { validationResult } = require('express-validator');
const ventasService = require('../services/ventasService');

const getAll = async (req, res, next) => {
  try { res.json(await ventasService.getAll()); } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try { res.json(await ventasService.getById(req.params.id)); } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: errors.array()[0].msg });
    res.status(201).json(await ventasService.create(req.body));
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { estado } = req.body;
    res.json(await ventasService.updateEstado(req.params.id, estado));
  } catch (err) { next(err); }
};

const updateFactura = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: errors.array()[0].msg });
    const { numeroFactura, cliente, observaciones } = req.body;
    res.json(await ventasService.updateFactura(req.params.id, { numeroFactura, cliente, observaciones }));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try { await ventasService.remove(req.params.id); res.status(204).end(); } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, updateFactura, remove };
