function success(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}

function list(res, data) {
  return res.status(200).json({ ok: true, data, total: data.length });
}

module.exports = { success, list };
