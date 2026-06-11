const svc = require('../services/materiasPrimasService');

exports.getAll = async (req, res, next) => {
  try { res.json(await svc.getAll(req.query)); } catch (e) { next(e); }
};
exports.getById = async (req, res, next) => {
  try { res.json(await svc.getById(req.params.id)); } catch (e) { next(e); }
};
exports.create = async (req, res, next) => {
  try { res.status(201).json(await svc.create(req.body)); } catch (e) { next(e); }
};
exports.update = async (req, res, next) => {
  try { res.json(await svc.update(req.params.id, req.body)); } catch (e) { next(e); }
};
exports.remove = async (req, res, next) => {
  try { await svc.remove(req.params.id); res.status(204).end(); } catch (e) { next(e); }
};
