const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const service = require('../services/reporteService');

const getDashboard = asyncHandler(async (req, res) => {
  success(res, await service.dashboard());
});

const getStockCritico = asyncHandler(async (req, res) => {
  success(res, await service.stockCritico());
});

const getVentas = asyncHandler(async (req, res) => {
  const { desde, hasta } = req.query;
  success(res, await service.ventasPorPeriodo(desde, hasta));
});

const getProductosTop = asyncHandler(async (req, res) => {
  const { desde, hasta, limite } = req.query;
  success(res, await service.productosTop(desde, hasta, limite));
});

const getProduccion = asyncHandler(async (req, res) => {
  const { desde, hasta } = req.query;
  success(res, await service.produccionPorPeriodo(desde, hasta));
});

const getRentabilidad = asyncHandler(async (req, res) => {
  success(res, await service.rentabilidad());
});

module.exports = {
  getDashboard,
  getStockCritico,
  getVentas,
  getProductosTop,
  getProduccion,
  getRentabilidad,
};
