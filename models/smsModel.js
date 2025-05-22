const db = require('../config/db');
const { logger } = require('../config/logger');

/**
 * 保存短信记录
 * @param {Object} smsData - 短信数据
 * @param {Boolean} isOutgoing - 是否为发送短信(true)还是接收短信(false)
 */
const saveSmsRecord = async (smsData, isOutgoing) => {
  try {
    // 解析短信数据
    let msgId, sender, receiver, content, userId, imsi, sendTime, status;
    
    if (isOutgoing) {
      // 发送短信
      msgId = smsData.msg_id || smsData.data;
      sender = '';
      receiver = smsData.sms_receiver;
      content = smsData.content;
      userId = smsData.userId;
      imsi = null; // 可能需要根据userId查询对应的imsi
      sendTime = new Date();
      status = smsData.code === '3810000' ? 'success' : 'failed';
    } else {
      // 接收短信
      // 可能需要解析响应中的data字段，它可能是JSON字符串
      let data = smsData.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          logger.error('解析短信数据失败', { error: e.message, data });
        }
      }
      
      msgId = data.msg_id;
      sender = data.sender;
      receiver = data.receiver;
      content = data.content;
      userId = smsData.userId; // 从请求参数获取
      imsi = null; // 可能需要根据userId查询
      sendTime = data.date ? new Date(data.date) : new Date();
      status = 'received';
    }
    
    // 存储到数据库
    await db.query(
      `INSERT INTO card_pool.sms_records 
       (msg_id, sender, receiver, content, user_id, imsi, send_time, status, is_outgoing)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [msgId, sender, receiver, content, userId, imsi, sendTime, status, isOutgoing]
    );
    
    logger.info(`保存短信记录成功`, { msgId, isOutgoing });
    return true;
  } catch (err) {
    logger.error('保存短信记录失败', { error: err.message });
    throw err;
  }
};

/**
 * 更新短信状态
 * @param {String} msgId - 短信ID
 * @param {Object} statusData - 状态数据
 */
const updateSmsStatus = async (msgId, statusData) => {
  try {
    // 解析状态数据
    let data = statusData.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        logger.error('解析短信状态数据失败', { error: e.message, data });
      }
    }
    
    const success = data.success;
    const status = success ? 'delivered' : 'failed';
    
    // 更新数据库记录
    await db.query(
      `UPDATE card_pool.sms_records 
       SET status = $1
       WHERE msg_id = $2`,
      [status, msgId]
    );
    
    logger.info(`更新短信状态成功`, { msgId, status });
    return true;
  } catch (err) {
    logger.error('更新短信状态失败', { error: err.message, msgId });
    throw err;
  }
};

/**
 * 获取短信记录
 * @param {Object} filters - 过滤条件
 * @param {Number} page - 页码
 * @param {Number} size - 每页数量
 */
const getSmsRecords = async (filters = {}, page = 1, size = 20) => {
  try {
    const offset = (page - 1) * size;
    let whereClause = '';
    const queryParams = [];
    let paramCount = 1;
    
    // 构建WHERE子句
    if (Object.keys(filters).length > 0) {
      whereClause = 'WHERE ';
      const conditions = [];
      
      if (filters.userId) {
        conditions.push(`user_id = $${paramCount++}`);
        queryParams.push(filters.userId);
      }
      
      if (filters.msgId) {
        conditions.push(`msg_id = $${paramCount++}`);
        queryParams.push(filters.msgId);
      }
      
      if (filters.isOutgoing !== undefined) {
        conditions.push(`is_outgoing = $${paramCount++}`);
        queryParams.push(filters.isOutgoing);
      }
      
      whereClause += conditions.join(' AND ');
    }
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) FROM card_pool.sms_records ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // 获取数据
    const dataQuery = `
      SELECT * FROM card_pool.sms_records 
      ${whereClause} 
      ORDER BY send_time DESC 
      LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    
    const dataParams = [...queryParams, size, offset];
    const dataResult = await db.query(dataQuery, dataParams);
    
    return {
      content: dataResult.rows,
      totalCount,
      page,
      size,
      totalPages: Math.ceil(totalCount / size)
    };
  } catch (err) {
    logger.error('获取短信记录失败', { error: err.message });
    throw err;
  }
};

/**
 * 根据消息ID获取单条短信记录
 * @param {String} msgId - 短信ID
 */
const getSmsRecordByMsgId = async (msgId) => {
  try {
    const result = await db.query(
      'SELECT * FROM card_pool.sms_records WHERE msg_id = $1',
      [msgId]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (err) {
    logger.error('根据消息ID获取短信记录失败', { error: err.message, msgId });
    throw err;
  }
};

module.exports = {
  saveSmsRecord,
  updateSmsStatus,
  getSmsRecords,
  getSmsRecordByMsgId
}; 