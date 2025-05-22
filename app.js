const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const db = require('./config/db');
const { logger } = require('./config/logger');
const routes = require('./routes');
require('dotenv').config();

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 创建日志目录
const logDirectory = path.join(__dirname, 'logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// 设置中间件
app.use(helmet()); // 安全增强
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体

// 请求日志记录
app.use(morgan('combined', {
  stream: fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' })
}));
app.use(morgan('dev'));

// 添加请求时间中间件
app.use((req, res, next) => {
  req.requestTime = new Date();
  next();
});

// API路由
app.use('/api', routes);

// 根路由
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: '卡池API代理服务正在运行'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: '4040000',
    msg: '请求的资源不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error('应用错误', { 
    error: err.message, 
    stack: err.stack,
    path: req.originalUrl,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    code: '5000000',
    msg: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '请联系管理员'
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      logger.error('无法连接到数据库，应用将退出');
      process.exit(1);
    }
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      logger.info(`服务器已启动，监听端口: ${PORT}`);
      console.log(`服务器已启动，监听端口: ${PORT}`);
    });
  } catch (err) {
    logger.error('启动服务器失败', { error: err.message });
    console.error('启动服务器失败:', err);
    process.exit(1);
  }
};

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常', { error: err.message, stack: err.stack });
  console.error('未捕获的异常:', err);
  process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝', { reason });
  console.error('未处理的Promise拒绝:', reason);
});

// 启动服务器
startServer(); 