export function jsonResult(promise) {
  return Promise.resolve(promise).then(
    (body) => Response.json(body),
    (error) => {
      const status = error?.status || 500;
      console.error('API', status, error?.message || error);
      return Response.json({ error: status === 500 ? 'Erreur serveur.' : error.message }, { status });
    },
  );
}
