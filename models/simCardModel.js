const db = require('../config/db');
const { logger } = require('../config/logger');
const format = require('pg-format');

/**
 * 处理从API获取的卡列表数据，保存到数据库
 * @param {Array} simCards - SIM卡数据数组
 * 
 * 注意：此函数仅更新第三方API返回的字段，
 * 如果数据库表中添加了自定义字段，这些字段不会被此函数覆盖或清空。
 * 在添加新的字段到card_pool.sim_cards表时，无需修改此函数，
 * 因为ON CONFLICT语句中只设置了API返回的字段。
 */
const saveSimCards = async (simCards) => {
  // 如果没有数据，直接返回
  if (!simCards || simCards.length === 0) {
    logger.info('没有SIM卡数据需要保存');
    return true;
  }
  
  try {
    // 使用批量插入优化性能
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // API字段与数据库字段的映射关系
      const fieldMapping = {
        id: 'card_id',
        iccid: 'iccid',
        imsi: 'imsi',
        mcc: 'mcc',
        mnc: 'mnc',
        isActivate: 'is_activate',
        isBroken: 'is_broken',
        isDisabled: 'is_disabled',
        isInSimpool: 'is_in_simpool',
        locationInSimPool: 'location_in_sim_pool',
        simPoolMacAddr: 'sim_pool_mac_addr',
        userId: 'user_id',
        name: 'name',
        bindNumber: 'bind_number',
        imgMd5: 'img_md5',
        operatorId: 'operator_id',
        orgCode: 'org_code',
        phoneNumber: 'phone_number',
        updateAt: 'update_at'
      };
      
      // 动态检查第一个记录中存在的字段
      const sampleCard = simCards[0];
      const fieldsToInsert = [];
      const fieldsToUpdate = [];
      const mappingEntries = Object.entries(fieldMapping);
      
      for (const [apiField, dbField] of mappingEntries) {
        if (apiField in sampleCard) {
          fieldsToInsert.push(dbField);
          fieldsToUpdate.push(`${dbField} = EXCLUDED.${dbField}`);
        }
      }
      
      // 构建批量插入SQL - 不再在VALUES中添加updated_at
      const baseQuery = `
        INSERT INTO card_pool.sim_cards (
          ${fieldsToInsert.join(', ')}
        ) VALUES %L
        ON CONFLICT (imsi) DO UPDATE SET
          ${fieldsToUpdate.join(',\n          ')},
          updated_at = CURRENT_TIMESTAMP`;
      
      // 准备批量数据，不再包含updated_at字段
      const values = simCards.map(card => {
        const rowValues = [];
        for (const [apiField, dbField] of mappingEntries) {
          if (fieldsToInsert.includes(dbField)) {
            rowValues.push(card[apiField]);
          }
        }
        return rowValues;
      });
      
      // 使用pg-format进行批量插入
      const formattedQuery = format(baseQuery, values);
      await client.query(formattedQuery);
      
      await client.query('COMMIT');
      logger.info(`批量保存/更新 ${simCards.length} 张SIM卡信息，字段：${fieldsToInsert.join(', ')}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
    return true;
  } catch (err) {
    logger.error('保存SIM卡信息失败', { error: err.message });
    throw err;
  }
};

/**
 * 查询SIM卡列表
 * @param {Object} filters - 过滤条件
 * @param {Number} page - 页码
 * @param {Number} size - 每页数量
 * @returns {Object} - 分页后的SIM卡列表数据
 */
const getSimCards = async (filters = {}, page = 1, size = 20) => {
  try {
    const offset = (page - 1) * size;
    let whereClause = '';
    const queryParams = [];
    let paramCount = 1;
    
    // 构建WHERE子句
    if (Object.keys(filters).length > 0) {
      whereClause = 'WHERE ';
      const conditions = [];
      
      if (filters.imsi) {
        conditions.push(`imsi LIKE $${paramCount++}`);
        queryParams.push(`%${filters.imsi}%`);
      }
      
      if (filters.userId) {
        conditions.push(`user_id = $${paramCount++}`);
        queryParams.push(filters.userId);
      }
      
      if (filters.simPoolMacAddr) {
        conditions.push(`sim_pool_mac_addr = $${paramCount++}`);
        queryParams.push(filters.simPoolMacAddr);
      }
      
      whereClause += conditions.join(' AND ');
    }
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) FROM card_pool.sim_cards ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // 获取数据
    const dataQuery = `
      SELECT * FROM card_pool.sim_cards 
      ${whereClause} 
      ORDER BY updated_at DESC 
      LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    
    const dataParams = [...queryParams, size, offset];
    const dataResult = await db.query(dataQuery, dataParams);
    
    return {
      content: dataResult.rows.map(row => ({
        id: row.card_id,
        iccid: row.iccid,
        imsi: row.imsi,
        mcc: row.mcc,
        mnc: row.mnc,
        isActivate: row.is_activate,
        isBroken: row.is_broken,
        isDisabled: row.is_disabled,
        isInSimpool: row.is_in_simpool,
        locationInSimPool: row.location_in_sim_pool,
        simPoolMacAddr: row.sim_pool_mac_addr,
        userId: row.user_id,
        name: row.name,
        bindNumber: row.bind_number,
        imgMd5: row.img_md5,
        operatorId: row.operator_id,
        orgCode: row.org_code,
        phoneNumber: row.phone_number,
        updateAt: row.update_at
      })),
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
      empty: dataResult.rows.length === 0
    };
  } catch (err) {
    logger.error('查询SIM卡列表失败', { error: err.message });
    throw err;
  }
};

/**
 * 根据手机号查询SIM卡信息及状态
 * @param {String} phoneNumber - 手机号码 
 * @returns {Object} - SIM卡详细信息(包含状态)
 */
const getSimCardWithStatus = async (phoneNumber) => {
  try {
    logger.info(`尝试查询手机号: ${phoneNumber}`);
    
    // 确保phoneNumber不为空
    if (!phoneNumber) {
      logger.error('手机号为空');
      return null;
    }
    
    // 记录原始查询参数
    logger.info(`查询参数: ${JSON.stringify({phoneNumber})}`);
    
    // 移除可能存在的特殊字符，只保留数字部分
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
    logger.info(`清理后的手机号: ${cleanedPhoneNumber}`);
    
    // 使用精确匹配先尝试，更可靠
    let result = await db.query(
      'SELECT * FROM card_pool.sim_cards WHERE phone_number = $1',
      [phoneNumber]
    );
    
    // 如果精确匹配没找到，再尝试模糊匹配
    if (result.rows.length === 0) {
      logger.info(`精确匹配未找到手机号 ${phoneNumber}，尝试模糊匹配`);
      result = await db.query(
        'SELECT * FROM card_pool.sim_cards WHERE phone_number LIKE $1',
        [`%${cleanedPhoneNumber}%`]
      );
    }
    
    if (result.rows.length === 0) {
      logger.info(`未找到匹配的手机号码: ${phoneNumber}`);
      return null;
    }
    
    const row = result.rows[0];
    logger.info(`成功找到手机号码 ${phoneNumber} => ${row.phone_number}, IMSI: ${row.imsi}`);
    
    return {
      id: row.card_id,
      iccid: row.iccid,
      imsi: row.imsi,
      mcc: row.mcc,
      mnc: row.mnc,
      phoneNumber: row.phone_number,
      isInUsed: row.is_used,
      userId: row.user_id
    };
  } catch (err) {
    logger.error(`根据手机号查询SIM卡失败: ${err.message}`, { 
      error: err.message, 
      stack: err.stack,
      phoneNumber 
    });
    throw err;
  }
};

/**
 * 根据IMSI查询单个SIM卡信息
 * @param {String} imsi - SIM卡的IMSI
 * @returns {Object} - SIM卡详细信息
 */
const getSimCardByImsi = async (imsi) => {
  try {
    const result = await db.query(
      'SELECT * FROM card_pool.sim_cards WHERE imsi = $1',
      [imsi]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.card_id,
      iccid: row.iccid,
      imsi: row.imsi,
      mcc: row.mcc,
      mnc: row.mnc,
      isActivate: row.is_activate,
      isBroken: row.is_broken,
      isDisabled: row.is_disabled,
      isInSimpool: row.is_in_simpool,
      locationInSimPool: row.location_in_sim_pool,
      simPoolMacAddr: row.sim_pool_mac_addr,
      userId: row.user_id,
      name: row.name,
      bindNumber: row.bind_number,
      imgMd5: row.img_md5,
      operatorId: row.operator_id,
      orgCode: row.org_code,
      phoneNumber: row.phone_number,
      updateAt: row.update_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  } catch (err) {
    logger.error('根据IMSI查询SIM卡失败', { error: err.message, imsi });
    throw err;
  }
};

/**
 * 更新SIM卡使用状态
 * @param {String} imsi - SIM卡IMSI
 * @param {String} userId - 用户ID
 * @param {Boolean} isInUsed - 是否被使用
 */
const updateSimCardStatus = async (imsi, userId, isInUsed) => {
  try {
    await db.query(
      `UPDATE card_pool.sim_cards 
       SET is_used = $1, user_id = $2, updated_at = CURRENT_TIMESTAMP
       WHERE imsi = $3`,
      [isInUsed, userId, imsi]
    );
    
    logger.info(`更新SIM卡状态`, { imsi, userId, isInUsed });
    return true;
  } catch (err) {
    logger.error('更新SIM卡状态失败', { error: err.message, imsi });
    throw err;
  }
};

/**
 * 解绑设备下的卡
 */
async function releaseCardByDevice(deviceId) {
  await db.query(
    'UPDATE card_pool.sim_cards SET is_used = false, device_number = NULL WHERE device_number = $1 AND is_used = true',
    [deviceId]
  );
}

/**
 * 绑定卡到设备
 */
async function bindCardToDevice(imsi, deviceId, userId) {
  await db.query(
    'UPDATE card_pool.sim_cards SET is_used = true, device_number = $1, user_id = $2 WHERE imsi = $3',
    [deviceId, userId, imsi]
  );
}

module.exports = {
  saveSimCards,
  getSimCards,
  getSimCardByImsi,
  getSimCardWithStatus,
  updateSimCardStatus,
  releaseCardByDevice,
  bindCardToDevice
};
