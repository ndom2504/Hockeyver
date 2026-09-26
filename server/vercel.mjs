export function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
}

export function readJson(req) {
  const body = req.body;
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) return body;
  const raw = Buffer.isBuffer(body) ? body.toString('utf8') : typeof body === 'string' ? body : '';
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function finish(res, promise) {
  return Promise.resolve(promise)
    .then((body) => {
      res.status(200).json(body);
    })
    .catch((error) => {
      const status = error.status || 500;
      res.status(status).json({ error: status === 500 ? 'Erreur serveur.' : error.message });
    });
}
