export function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
