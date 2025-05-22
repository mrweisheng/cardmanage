/**
 * 短信控制器
 * 处理与短信相关的请求
 */
const { callApi } = require('../utils/apiClient');
const smsModel = require('../models/smsModel');
const { logger } = require('../config/logger');

/**
 * 收短信
 */
const getSms = async (req, res) => {
  try {
    const { userId } = req.query;
    
    // 调用第三方API
    const apiResponse = await callApi('GET', '/outbreak/getSms', {
      userId
    }, {}, req.ip);
    
    // 如果API返回成功，保存短信记录到数据库
    if (apiResponse && apiResponse.code === '3810000' && apiResponse.data) {
      // 添加userId，然后保存
      apiResponse.userId = userId;
      await smsModel.saveSmsRecord(apiResponse, false);
    }
    
    // 返回第三方API的原始响应
    res.json(apiResponse);
  } catch (error) {
    logger.error('收短信失败', { error: error.message });
    res.status(500).json({
      code: '5000000',
      msg: '收短信失败',
      error: error.message
    });
  }
};

/**
 * 发短信
 */
const sendSms = async (req, res) => {
  try {
    const { userId, sms_receiver, content, msg_id } = req.body;
    
    // 调用第三方API
    const apiResponse = await callApi('POST', '/outbreak/sendSms', {
      userId,
      sms_receiver,
      content,
      msg_id
    }, {}, req.ip);
    
    // 如果API返回成功，保存短信记录到数据库
    if (apiResponse && apiResponse.code === '3810000') {
      // 将请求和响应结合，然后保存
      const smsData = {
        ...req.body,
        ...apiResponse
      };
      await smsModel.saveSmsRecord(smsData, true);
    }
    
    // 返回第三方API的原始响应
    res.json(apiResponse);
  } catch (error) {
    logger.error('发短信失败', { error: error.message });
    res.status(500).json({
      code: '5000000',
      msg: '发短信失败',
      error: error.message
    });
  }
};

/**
 * 获取短信发送结果
 */
const getSendResult = async (req, res) => {
  try {
    const { msgId } = req.query;
    
    // 调用第三方API
    const apiResponse = await callApi('GET', '/outbreak/sendResult', {
      msgId
    }, {}, req.ip);
    
    // 如果API返回成功，更新短信状态
    if (apiResponse && apiResponse.code === '3810000' && apiResponse.data) {
      await smsModel.updateSmsStatus(msgId, apiResponse);
    }
    
    // 返回第三方API的原始响应
    res.json(apiResponse);
  } catch (error) {
    logger.error('获取短信发送结果失败', { error: error.message });
    res.status(500).json({
      code: '5000000',
      msg: '获取短信发送结果失败',
      error: error.message
    });
  }
};

/**
 * 从本地数据库获取短信记录
 * 不调用第三方API，仅查询本地数据库
 */
const getSmsRecords = async (req, res) => {
  try {
    const { userId, msgId, isOutgoing, page = 1, size = 20 } = req.body;
    
    // 构建查询条件
    const filters = {};
    if (userId) filters.userId = userId;
    if (msgId) filters.msgId = msgId;
    if (isOutgoing !== undefined) filters.isOutgoing = isOutgoing === 'true' || isOutgoing === true;
    
    // 查询本地数据库
    const result = await smsModel.getSmsRecords(filters, parseInt(page), parseInt(size));
    
    // 格式化为与API相同的响应格式
    res.json({
      code: '3810000',
      msg: 'success',
      data: result
    });
  } catch (error) {
    logger.error('查询短信记录失败', { error: error.message });
    res.status(500).json({
      code: '5000000',
      msg: '查询短信记录失败',
      error: error.message
    });
  }
};

/**
 * 根据消息ID获取短信详情
 */
const getSmsRecordByMsgId = async (req, res) => {
  try {
    const { msgId } = req.params;
    
    // 查询本地数据库
    const smsRecord = await smsModel.getSmsRecordByMsgId(msgId);
    
    if (!smsRecord) {
      return res.status(404).json({
        code: '4040000',
        msg: '未找到指定的短信记录'
      });
    }
    
    res.json({
      code: '3810000',
      msg: 'success',
      data: smsRecord
    });
  } catch (error) {
    logger.error('查询短信详情失败', { error: error.message });
    res.status(500).json({
      code: '5000000',
      msg: '查询短信详情失败',
      error: error.message
    });
  }
};

module.exports = {
  getSms,
  sendSms,
  getSendResult,
  getSmsRecords,
  getSmsRecordByMsgId
}; 