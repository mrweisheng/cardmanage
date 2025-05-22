const db = require('../config/db');
const { logger } = require('../config/logger');

/**
 * 保存/更新设备信息
 * @param {Object} deviceData - 设备数据
 */
const saveDevice = async (deviceData) => {
  try {
    // 解析设备数据
    const device = deviceData.clients || deviceData;
    
    // 使用UPSERT语法来新增或更新数据
    await db.query(
      `INSERT INTO card_pool.devices (
        device_id, user_id, status, name, in_use, device_type, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        device_id = $1,
        status = $3,
        name = $4,
        in_use = $5,
        device_type = $6,
        updated_at = CURRENT_TIMESTAMP`,
      [
        device.id,
        device.userId,
        device.status,
        device.name,
        device.inUser,
        device.type
      ]
    );
    
    logger.info(`成功保存/更新设备信息`, { userId: device.userId });
    return true;
  } catch (err) {
    logger.error('保存设备信息失败', { error: err.message });
    throw err;
  }
};

/**
 * 根据用户ID获取设备信息
 * @param {String} userId - 用户ID
 */
const getDeviceByUserId = async (userId) => {
  try {
    const result = await db.query(
      'SELECT * FROM card_pool.devices WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.device_id,
      userId: row.user_id,
      status: row.status,
      name: row.name,
      inUser: row.in_use,
      type: row.device_type,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  } catch (err) {
    logger.error('根据用户ID获取设备信息失败', { error: err.message, userId });
    throw err;
  }
};

/**
 * 查询设备列表
 * @param {Object} filters - 过滤条件
 * @param {Number} page - 页码
 * @param {Number} size - 每页数量
 */
const getDevices = async (filters = {}, page = 1, size = 20) => {
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
      
      if (filters.name) {
        conditions.push(`name LIKE $${paramCount++}`);
        queryParams.push(`%${filters.name}%`);
      }
      
      whereClause += conditions.join(' AND ');
    }
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) FROM card_pool.devices ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // 获取数据
    const dataQuery = `
      SELECT * FROM card_pool.devices 
      ${whereClause} 
      ORDER BY updated_at DESC 
      LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    
    const dataParams = [...queryParams, size, offset];
    const dataResult = await db.query(dataQuery, dataParams);
    
    const devices = dataResult.rows.map(row => ({
      id: row.device_id,
      userId: row.user_id,
      status: row.status,
      name: row.name,
      inUser: row.in_use,
      type: row.device_type,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    return {
      content: devices,
      pageable: {
        pageNumber: page - 1,
        pageSize: size,
        offset
      },
      totalPages: Math.ceil(totalCount / size),
      totalElements: totalCount,
      last: page * size >= totalCount,
      first: page === 1,
      size,
      number: page - 1,
      empty: devices.length === 0
    };
  } catch (err) {
    logger.error('查询设备列表失败', { error: err.message });
    throw err;
  }
};

module.exports = {
  saveDevice,
  getDeviceByUserId,
  getDevices
}; 