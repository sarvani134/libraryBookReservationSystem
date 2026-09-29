export function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export function errorHandler(error, req, res, next) {
  const status =
    error.status ||
    (['ValidationError', 'CastError'].includes(error.name)
      ? 400
      : error.code === 11000
        ? 409
        : 500);
  if (status === 500) console.error(error);
  res.status(status).json({
    message: status === 500 ? 'Unable to complete your request. Please try again.' : error.message,
  });
}
