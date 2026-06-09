const jwt = require('jsonwebtoken');

function authJwt(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid authorization token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
}

function requireAdminForWrite(req, res, next) {
  const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (!writeMethods.includes(req.method)) {
    return next();
  }

  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return next();
}

module.exports = {
  authJwt,
  requireRole,
  requireAdminForWrite
};
