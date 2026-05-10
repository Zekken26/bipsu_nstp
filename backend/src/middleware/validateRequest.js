export function validateRequest(schema) {
  return (req, res, next) => {
    if (!schema || typeof schema.safeParse !== 'function') {
      return next();
    }

    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: result.error.flatten(),
      });
    }

    req.validated = result.data;
    return next();
  };
}
