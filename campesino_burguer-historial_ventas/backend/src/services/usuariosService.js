const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Usuario } = require('../models');

const ROLES = ['ADMIN', 'MESERO'];
const attributes = { exclude: ['password_hash'] };

const getAll = async () =>
  Usuario.findAll({ attributes, order: [['nombre', 'ASC']] });

const getById = async (id) => {
  const u = await Usuario.findByPk(id, { attributes });
  if (!u) throw { status: 404, message: 'Usuario no encontrado' };
  return u;
};

async function assertUltimoAdmin(id, cambios) {
  const usuario = await Usuario.findByPk(id);
  const dejaDeSerAdminActivo =
    usuario.role === 'ADMIN' && usuario.activo &&
    ((cambios.role !== undefined && cambios.role !== 'ADMIN') || cambios.activo === false);

  if (dejaDeSerAdminActivo) {
    const otrosAdmins = await Usuario.count({ where: { role: 'ADMIN', activo: true, id: { [Op.ne]: id } } });
    if (otrosAdmins === 0) {
      throw { status: 400, message: 'No puedes quitar el rol o desactivar al único administrador activo' };
    }
  }
}

const create = async ({ nombre, username, password, role }) => {
  if (!ROLES.includes(role)) throw { status: 400, message: 'Rol inválido' };
  const existente = await Usuario.findOne({ where: { username } });
  if (existente) throw { status: 400, message: 'Ese nombre de usuario ya está en uso' };

  const password_hash = await bcrypt.hash(password, 10);
  const usuario = await Usuario.create({ nombre: nombre.trim(), username: username.trim(), password_hash, role });
  return getById(usuario.id);
};

const update = async (id, { nombre, username, password, role, activo }) => {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw { status: 404, message: 'Usuario no encontrado' };

  if (role !== undefined && !ROLES.includes(role)) throw { status: 400, message: 'Rol inválido' };

  await assertUltimoAdmin(id, { role, activo });

  if (username !== undefined && username.trim() !== usuario.username) {
    const existente = await Usuario.findOne({ where: { username: username.trim() } });
    if (existente) throw { status: 400, message: 'Ese nombre de usuario ya está en uso' };
  }

  const patch = {};
  if (nombre !== undefined) patch.nombre = nombre.trim();
  if (username !== undefined) patch.username = username.trim();
  if (role !== undefined) patch.role = role;
  if (activo !== undefined) patch.activo = activo;
  if (password) patch.password_hash = await bcrypt.hash(password, 10);

  await usuario.update(patch);
  return getById(id);
};

module.exports = { getAll, getById, create, update };
