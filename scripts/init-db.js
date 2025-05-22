/**
 * 数据库初始化脚本
 * 用于创建数据库和所需表
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// 创建一个没有指定数据库的连接池，用于创建数据库
const adminPool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: 'postgres',
  ssl: process.env.DB_SSL === 'true'
});

// 创建数据库
const createDatabase = async () => {
  const client = await adminPool.connect();
  try {
    console.log(`检查数据库 ${process.env.DB_NAME} 是否存在...`);
    
    // 检查数据库是否存在
    const checkResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.DB_NAME]
    );
    
    if (checkResult.rows.length === 0) {
      console.log(`创建数据库 ${process.env.DB_NAME}...`);
      // 创建数据库
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`数据库 ${process.env.DB_NAME} 创建成功`);
    } else {
      console.log(`数据库 ${process.env.DB_NAME} 已存在`);
    }
    
    return true;
  } catch (err) {
    console.error('创建数据库失败:', err);
    return false;
  } finally {
    client.release();
  }
};

// 创建表结构
const createTables = async () => {
  // 创建一个连接到特定数据库的连接池
  const dbPool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true'
  });
  
  try {
    console.log('创建表结构...');
    
    // 读取SQL文件内容
    const sqlFilePath = path.join(__dirname, '..', 'db_schema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 执行SQL语句
    await dbPool.query(sqlContent);
    
    console.log('表结构创建成功');
    return true;
  } catch (err) {
    console.error('创建表结构失败:', err);
    return false;
  } finally {
    await dbPool.end();
  }
};

// 主函数
const init = async () => {
  try {
    // 创建数据库
    const dbCreated = await createDatabase();
    if (!dbCreated) {
      process.exit(1);
    }
    
    // 创建表结构
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      process.exit(1);
    }
    
    console.log('数据库初始化完成');
    process.exit(0);
  } catch (err) {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  } finally {
    await adminPool.end();
  }
};

// 执行初始化
init(); 