/**
 * SIM卡控制器
 * 处理与SIM卡相关的请求
 */
const { callApi, callApiWithFormData, logOperation } = require('../utils/apiClient');
const simCardModel = require('../models/simCardModel');
const { logger } = require('../config/logger');

/**
 * 获取SIM卡列表
 */
const getSimCards = async (req, res) => {
  try {
    const { imsi, userId, simPoolMacAddr, page = 1, size = 20 } = req.body;
    
    // 调用第三方API
    const apiResponse = await callApi('POST', '/outbreak/simCardsList', {
      imsi,
      userId,
      simPoolMacAddr,
      page: parseInt(page),
      size: parseInt(size)
    }, {}, req.ip);
    
    // 如果API返回成功，异步保存数据到数据库（不阻塞主请求）
    if (apiResponse && apiResponse.code === '3810000' && apiResponse.data && apiResponse.data.content) {
      process.nextTick(() => {
        simCardModel.saveSimCards(apiResponse.data.content)
          .catch(err => logger.error('异步保存SIM卡数据失败', { error: err.message }));
      });
    }
    
    // 立即返回第三方API的原始响应，不等待数据库操作
    return res.json(apiResponse);
  } catch (error) {
    logger.error('获取SIM卡列表失败', { error: error.message });
    res.status(500).json({
      code: '5000000',
      msg: '获取SIM卡列表失败',
      error: error.message
    });
  }
};

/**
 * 切卡 - 将SIM卡分配给用户
 */
const clientsSpilt = async (req, res) => {
  try {
    const { userId, phoneNumber, deviceId } = req.body;
    logger.info('收到切卡请求', { userId, phoneNumber, deviceId });
    if (!userId || !phoneNumber || !deviceId) {
      logger.error('切卡请求参数不完整', { userId, phoneNumber, deviceId });
      return res.status(400).json({
        code: '4000001',
        msg: '参数不完整，缺少userId、phoneNumber或deviceId',
        data: { userId, phoneNumber, deviceId }
      });
    }
    // 查找目标卡
    let simCard;
    try {
      simCard = await simCardModel.getSimCardWithStatus(phoneNumber);
    } catch (err) {
      logger.error(`查询SIM卡信息时发生错误: ${err.message}`, { error: err.stack });
      return res.status(500).json({
        code: '5000001',
        msg: '查询SIM卡信息失败',
        error: err.message
      });
    }
    if (!simCard) {
      logger.warn('未找到匹配的SIM卡', { phoneNumber });
      return res.status(400).json({
        code: '4000002',
        msg: '无效的手机号码',
        data: { phoneNumber }
      });
    }
    // 校验该卡是否被其他设备占用
    if (simCard.is_in_used && simCard.device_number !== deviceId) {
      logger.warn('目标卡已被其他设备占用', { phoneNumber, device_number: simCard.device_number });
      return res.status(400).json({
        code: '4000003',
        msg: '该卡已被其他设备占用，无法切换',
        data: { phoneNumber, device_number: simCard.device_number }
      });
    }
    // 查找该设备是否已绑定其他卡，解绑
    await simCardModel.releaseCardByDevice(deviceId);
    // 绑定新卡到设备
    await simCardModel.bindCardToDevice(simCard.imsi, deviceId, userId);
    // 调用第三方API
    logger.info('开始调用第三方API', { userId, imsi: simCard.imsi });
    const apiResponse = await callApi('POST', '/outbreak/clientsSpilt', {
      userId,
      imsi: simCard.imsi
    }, {}, req.ip);
    
    // 如果API返回成功，异步更新数据库状态和记录日志
    if (apiResponse && apiResponse.code === '3810000') {
      process.nextTick(() => {
        simCardModel.updateSimCardStatus(simCard.imsi, userId, true)
          .then(() => logOperation('切卡', userId, simCard.imsi, req.body, apiResponse, 'success'))
          .catch(err => logger.error('切卡异步处理失败', { error: err.message }));
      });
    } else {
      // 异步记录失败操作
      process.nextTick(() => {
        logOperation('切卡', userId, simCard.imsi, req.body, apiResponse, 'failed')
          .catch(err => logger.error('记录切卡失败日志失败', { error: err.message }));
      });
    }
    
    // 预定义状态码映射
    const statusCodeMap = {
      '0x03810000': '操作成功',
      '0x03810001': '用户未登录',
      '0x03810002': 'simpool未登录',
      '0x03810003': 'simpool不在线',
      '0x03810004': '用户未分卡',
      '0x03810005': '用户余额不足',
      '0x03810006': '用户自己操作',
      '0x03810007': '无效参数',
      '0x02810100': '包应答超时',
      '0x03810101': '包解析错误',
      '0x02810102': 'socket异常',
      '0x01810103': '服务暂不可用',
      '0x01810104': '服务忙,稍候重试',
      '0x03810105': '服务异常终止',
      '0x02830000': 'M网用户注册失败',
      '0x03830001': '登录密码错误',
      '0x03830002': '用户已被禁用',
      '0x03830003': 'SP已被禁用',
      '0x03830004': '用户名不存在',
      '0x03830005': '用户修改密码',
      '0x03830006': '用户在其它设备登录',
      '0x01830007': '协议版本不兼容',
      '0x01830008': '软件版本错误',
      '0x03830009': '无效的session id',
      '0x0183000a': 'mac地址错误',
      '0x0183000b': '卡池容量错误',
      '0x0183000c': '卡池硬件版本错误',
      '0x0183000d': '卡池软件版本错误',
      '0x03820000': '未绑卡用户无卡可分或换',
      '0x03820001': '已绑卡用户无卡可分或换',
      '0x03820002': '本地无服务',
      '0x03820003': '用户是rtu模式',
      '0x03820004': 'sim卡余额不足',
      '0x03820005': 'sim卡已不可用',
      '0x03820006': 'vip用户抢占',
      '0x03840307': '云卡状态异常',
      '0x03840322': '镜像文件缺失',
      '0x03840327': '位置更新被拒绝',
      '0x03840328': '路由区更新被拒绝',
      '0x03840329': '跟踪区更新被拒绝',
      '0x0384032a': '附着被拒绝',
      '0x0384032b': '鉴权超时',
      '0x0384032d': 'PDP激活被拒绝',
      '0x0384032e': 'EPS承载激活被拒绝',
      '0x03840330': '服务被拒绝',
      '0x03840334': '云卡余额不足',
      '0x03840335': '账户余额不足',
      '0x01850000': 'simpool离线',
      '0x02850001': '等待回应超时',
      '0x02850004': '数据包CRC校验失败',
      '0x01850104': 'SIM卡异常',
      '0x01850105': 'SIM卡丢失'
    };

    // 快速解析状态码
    let statusCode = null;
    let detailMsg = '未知状态';
    
    // 如果data已经是对象且包含code
    if (apiResponse.data && typeof apiResponse.data === 'object' && apiResponse.data.code) {
      statusCode = apiResponse.data.code;
    } 
    // 如果data是字符串且包含code
    else if (typeof apiResponse.data === 'string' && apiResponse.data.includes('code')) {
      try {
        // 快速提取code值，避免完整JSON解析
        const codeMatch = apiResponse.data.match(/"code"\s*:\s*"([^"]+)"/);
        statusCode = codeMatch ? codeMatch[1] : null;
      } catch (e) {
        // 极小概率出错时不阻塞主流程
      }
    }

    // 快速格式化状态码
    if (statusCode) {
      // 简单添加0x前缀（假设状态码已经是正确格式）
      if (!statusCode.startsWith('0x')) {
        statusCode = '0x0' + statusCode;
      }
      detailMsg = statusCodeMap[statusCode] || '未知状态';
    }

    // 构造并返回响应
    const response = {
      code: apiResponse.code,
      msg: apiResponse.msg,
      detailMsg,
      data: apiResponse.data
    };
    res.json(response);

    // 异步处理日志和数据库更新（不阻塞主流程）
    process.nextTick(() => {
      try {
        const logData = {
          userId,
          imsi: simCard.imsi,
          statusCode,
          detailMsg
        };

        if (apiResponse.code === '0x03810000') {
          Promise.all([
            simCardModel.updateSimCardStatus(simCard.imsi, userId, true),
            logOperation('切卡', logData.userId, simCard.imsi, logData, apiResponse, 'success')
          ]).catch(err => logger.error('异步处理失败', { error: err.message }));
        } else {
          logOperation('切卡', logData.userId, simCard.imsi, logData, apiResponse, 'failed')
            .catch(err => logger.error('记录失败日志失败', { error: err.message }));
        }
      } catch (e) {
        logger.error('异步处理异常', { error: e.message });
      }
    });
  } catch (error) {
    logger.error('切卡失败', { error: error.message });
    res.status(500).json({
      code: '5000000',
      msg: '切卡失败',
      error: error.message
    });
  }
};

/**
 * 强制还卡 - 释放用户分配的SIM卡
 */
const userRevuim = async (req, res) => {
  try {
    const { userId, needAdjust } = req.body;
    
    // 先获取用户当前使用的SIM卡信息，以便记录操作日志
    const userSimCard = await simCardModel.getSimCards({ userId, isInUsed: true });
    const imsi = userSimCard.content.length > 0 ? userSimCard.content[0].imsi : null;
    
    // 调用第三方API
    const apiResponse = await callApi('POST', '/outbreak/userRevuim', {
      userId,
      needAdjust
    }, {}, req.ip);
    
    // 如果API返回成功，异步更新数据库状态和记录日志
    if (apiResponse && apiResponse.code === '3810000' && imsi) {
      process.nextTick(() => {
        simCardModel.updateSimCardStatus(imsi, null, false)
          .then(() => logOperation('还卡', userId, imsi, req.body, apiResponse, 'success'))
          .catch(err => logger.error('还卡异步处理失败', { error: err.message }));
      });
    } else {
      // 异步记录失败操作
      process.nextTick(() => {
        logOperation('还卡', userId, imsi, req.body, apiResponse, 'failed')
          .catch(err => logger.error('记录还卡失败日志失败', { error: err.message }));
      });
    }
    
    // 返回第三方API的原始响应
    res.json(apiResponse);
  } catch (error) {
    logger.error('强制还卡失败', { error: error.message });
    res.status(500).json({
      code: '5000000',
      msg: '强制还卡失败',
      error: error.message
    });
  }
};

/**
 * 获取设备对应的卡
 */
const simpoolsDeatil = async (req, res) => {
  try {
    const { macAddress } = req.body;
    
    // 调用第三方API
    const apiResponse = await callApiWithFormData('/outbreak/simpoolsDeatil', {
      macAddress
    }, req.ip);
    
    // 返回第三方API的原始响应
    res.json(apiResponse);
  } catch (error) {
    logger.error('获取设备对应的卡失败', { error: error.message });
    res.status(500).json({
      code: '5000000',
      msg: '获取设备对应的卡失败',
      error: error.message
    });
  }
};

/**
 * 从本地数据库获取SIM卡列表
 * 不调用第三方API，仅查询本地数据库
 */
const getLocalSimCards = async (req, res) => {
  try {
    const { imsi, userId, simPoolMacAddr, page = 1, size = 20 } = req.body;
    
    // 构建查询条件
    const filters = {};
    if (imsi) filters.imsi = imsi;
    if (userId) filters.userId = userId;
    if (simPoolMacAddr) filters.simPoolMacAddr = simPoolMacAddr;
    
    // 查询本地数据库
    const result = await simCardModel.getSimCards(filters, parseInt(page), parseInt(size));
    
    // 格式化为与API相同的响应格式
    res.json({
      code: '3810000',
      msg: 'success',
      data: result
    });
  } catch (error) {
    logger.error('查询本地SIM卡列表失败', { error: error.message });
    res.status(500).json({
      code: '5000000',
      msg: '查询本地SIM卡列表失败',
      error: error.message
    });
  }
};

/**
 * 根据IMSI查询SIM卡详情
 */
const getSimCardByImsi = async (req, res) => {
  try {
    const { imsi } = req.params;
    
    // 查询本地数据库
    const simCard = await simCardModel.getSimCardByImsi(imsi);
    
    if (!simCard) {
      return res.status(404).json({
        code: '4040000',
        msg: '未找到指定的SIM卡'
      });
    }
    
    res.json({
      code: '3810000',
      msg: 'success',
      data: simCard
    });
  } catch (error) {
    logger.error('查询SIM卡详情失败', { error: error.message });
    res.status(500).json({
      code: '5000000',
      msg: '查询SIM卡详情失败',
      error: error.message
    });
  }
};

module.exports = {
  getSimCards,
  clientsSpilt,
  userRevuim,
  simpoolsDeatil,
  getLocalSimCards,
  getSimCardByImsi
};
