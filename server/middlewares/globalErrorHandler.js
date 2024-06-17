export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode ||= 500;
  err.message ||= 'Internal server error';

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
