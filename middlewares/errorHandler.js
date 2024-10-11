// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // 서버 콘솔에 에러 스택 출력

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).send({
    status: 'error',
    statusCode,
    message,
  });
};

module.exports = errorHandler;
