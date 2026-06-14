'use strict';

module.exports = {
  up: async (qi, Sq) => {
    await qi.addColumn('ventas', 'metodo_pago', { type: Sq.STRING(50), allowNull: true });
    await qi.addColumn('ventas', 'descuento_aplicado', { type: Sq.DECIMAL(12, 2), defaultValue: 0, allowNull: false });
    await qi.addColumn('ventas', 'valor_recibido', { type: Sq.DECIMAL(12, 2), allowNull: true });
    await qi.addColumn('ventas', 'cambio', { type: Sq.DECIMAL(12, 2), defaultValue: 0, allowNull: false });
  },
  down: async (qi) => {
    await qi.removeColumn('ventas', 'metodo_pago');
    await qi.removeColumn('ventas', 'descuento_aplicado');
    await qi.removeColumn('ventas', 'valor_recibido');
    await qi.removeColumn('ventas', 'cambio');
  },
};
