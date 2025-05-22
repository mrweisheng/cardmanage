const { Pool } = require('pg');
const { logger } = require('./logger');
require('dotenv').config();

// 记录数据库配置信息（不记录敏感信息）
logger.info('数据库配置', {
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL === 'true',
});

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true',
  // 增加连接超时和查询超时
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20, // 最大连接数
});

// 监听连接错误
pool.on('error', (err, client) => {
  logger.error('数据库连接池意外错误', { error: err.message, stack: err.stack });
});

// 测试数据库连接
const testConnection = async () => {
  try {
    const client = await pool.connect();
    logger.info('数据库连接成功');
    client.release();
    return true;
  } catch (err) {
    logger.error('数据库连接失败', { error: err.message, stack: err.stack });
    return false;
  }
};

// 简单的查询封装
const query = async (text, params) => {
  const start = Date.now();
  let client;
  
  try {
    // 更安全的获取连接方式
    client = await pool.connect();
    
    // 执行查询
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    
    // 简化长文本输出
    const truncatedText = text.length > 200 ? text.substring(0, 200) + '...' : text;
    
    console.log('执行查询', { text: truncatedText, duration, rows: res.rowCount });
    
    return res;
  } catch (err) {
    const duration = Date.now() - start;
    logger.error('查询执行错误', { 
      error: err.message, 
      stack: err.stack,
      query: text,
      params,
      duration
    });
    throw err;
  } finally {
    // 确保连接释放
    if (client) {
      client.release();
    }
  }
};

module.exports = {
  pool,
  query,
  testConnection
}; 