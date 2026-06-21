'use strict';

module.exports = {
  up: async (qi, Sq) => {
    await qi.addColumn('ventas', 'estado', {
      type: Sq.STRING(30),
      allowNull: false,
      defaultValue: 'activa',
    });
  },
  down: async (qi) => {
    await qi.removeColumn('ventas', 'estado');
  },
};
