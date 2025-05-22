const winston = require('winston');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 确保日志目录存在
const logDir = path.dirname(process.env.LOG_FILE_PATH);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 创建Winston日志实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'cardpool-proxy' },
  transports: [
    // 输出到控制台
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
      )
    }),
    // 输出到日志文件
    new winston.transports.File({ 
      filename: process.env.LOG_FILE_PATH,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// 简化日志记录的辅助函数
const logApiRequest = (req, startTime) => {
  const endTime = new Date();
  const executionTime = endTime - startTime;
  
  logger.info('API请求', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestTime: startTime.toISOString(),
    responseTime: endTime.toISOString(),
    executionTime: `${executionTime}ms`
  });
};

const logApiError = (req, err) => {
  logger.error('API错误', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    error: err.message,
    stack: err.stack
  });
};

module.exports = {
  logger,
  logApiRequest,
  logApiError
}; 