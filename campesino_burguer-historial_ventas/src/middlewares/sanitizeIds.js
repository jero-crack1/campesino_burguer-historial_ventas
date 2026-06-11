module.exports = function sanitizeIds(req, res, next) {
  for (const [key, value] of Object.entries(req.params)) {
    if (/id$/i.test(key) && !/^\d+$/.test(String(value))) {
      return res.status(400).json({ error: `Invalid identifier: ${key}` });
    }
  }

  return next();
};
