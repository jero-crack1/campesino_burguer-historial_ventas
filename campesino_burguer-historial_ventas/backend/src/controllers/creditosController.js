const svc = require('../services/creditosService');

exports.getAll = async (req, res, next) => {
  try { res.json(await svc.getAll(req.query.estado)); } catch (e) { next(e); }
};
exports.getById = async (req, res, next) => {
  try { res.json(await svc.getById(req.params.id)); } catch (e) { next(e); }
};
exports.update = async (req, res, next) => {
  try { res.json(await svc.update(req.params.id, req.body)); } catch (e) { next(e); }
};
exports.abonar = async (req, res, next) => {
  try { res.json(await svc.abonar(req.params.id, req.body)); } catch (e) { next(e); }
};
exports.pagarCompleto = async (req, res, next) => {
  try { res.json(await svc.pagarCompleto(req.params.id, req.body.fecha)); } catch (e) { next(e); }
};
