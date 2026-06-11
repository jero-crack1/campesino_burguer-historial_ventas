const reportesService = require('../services/reportesService');

const dashboard = async (req, res, next) => {
  try { res.json(await reportesService.dashboard()); } catch (err) { next(err); }
};

const ventasPorPeriodo = async (req, res, next) => {
  try { res.json(await reportesService.ventasPorPeriodo(req.query.desde, req.query.hasta)); } catch (err) { next(err); }
};

const productosTop = async (req, res, next) => {
  try { res.json(await reportesService.productosTop(req.query.desde, req.query.hasta, req.query.limite)); } catch (err) { next(err); }
};

const rentabilidad = async (req, res, next) => {
  try { res.json(await reportesService.rentabilidad()); } catch (err) { next(err); }
};

const stockCritico = async (req, res, next) => {
  try { res.json(await reportesService.stockCritico()); } catch (err) { next(err); }
};

module.exports = { dashboard, ventasPorPeriodo, productosTop, rentabilidad, stockCritico };
