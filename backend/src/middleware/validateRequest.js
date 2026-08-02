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

export function rejectProhibitedCredentialFields(req, res, next) {
  const prohibited = new Set(['passwordhash', 'resettoken', 'verificationtoken', 'refreshtoken']);
  const seen = new Set();

  function containsProhibitedField(value, allowPassword = true) {
    if (!value || typeof value !== 'object' || seen.has(value)) return false;
    seen.add(value);
    if (Array.isArray(value)) return value.some((item) => containsProhibitedField(item, allowPassword));
    return Object.entries(value).some(([key, nested]) => (
      prohibited.has(key.toLowerCase()) || (!allowPassword && key.toLowerCase() === 'password') || containsProhibitedField(nested, false)
    ));
  }

  if (containsProhibitedField(req.body)) {
    return res.status(400).json({ success: false, error: 'Request contains a prohibited credential field.' });
  }
  return next();
}
