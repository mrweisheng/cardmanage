/**
 * 设备控制器
 * 处理与设备相关的请求
 */
const { callApi, callApiWithFormData } = require('../utils/apiClient');
const deviceModel = require('../models/deviceModel');
const { logger } = require('../config/logger');

/**
 * 获取接入设备列表
 */
const getClients = async (req, res) => {
  try {
    const { userId, page = 1, size = 20 } = req.body;
    
    // 调用第三方API
    const apiResponse = await callApi('POST', '/outbreak/clients', {
      userId,
      page: parseInt(page),
      size: parseInt(size)
    }, {}, req.ip);
    
    // 如果API返回成功，保存数据到数据库
    if (apiResponse && apiResponse.code === '3810000' && apiResponse.data && apiResponse.data.content) {
      // 遍历设备列表，保存到数据库
      for (const device of apiResponse.data.content) {
        await deviceModel.saveDevice(device);
      }
    }
    
    // 返回第三方API的原始响应
    res.json(apiResponse);
  } catch (error) {
    logger.error('获取接入设备列表失败', { error: error.message });
    res.status(500).json({
      code: '5000000',
      msg: '获取接入设备列表失败',
      error: error.message
    });
  }
};

/**
 * 获取设备详情
 */
const getClientInfo = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // 调用第三方API
    const apiResponse = await callApiWithFormData('/outbreak/clientsInfo', {
      userId
    }, req.ip);
    
    // 如果API返回成功，保存数据到数据库
    if (apiResponse && apiResponse.code === '3810000' && apiResponse.data) {
      // 保存设备信息
      if (apiResponse.data.clients) {
        await deviceModel.saveDevice(apiResponse.data);
      }
    }
    
    // 返回第三方API的原始响应
    res.json(apiResponse);
  } catch (error) {
    logger.error('获取设备详情失败', { error: error.message });
    res.status(500).json({
      code: '5000000',
      msg: '获取设备详情失败',
      error: error.message
    });
  }
};

/**
 * 从本地数据库获取设备列表
 * 不调用第三方API，仅查询本地数据库
 */
const getLocalDevices = async (req, res) => {
  try {
    const { userId, name, page = 1, size = 20 } = req.body;
    
    // 构建查询条件
    const filters = {};
    if (userId) filters.userId = userId;
    if (name) filters.name = name;
    
    // 查询本地数据库
    const result = await deviceModel.getDevices(filters, parseInt(page), parseInt(size));
    
    // 格式化为与API相同的响应格式
    res.json({
      code: '3810000',
      msg: 'success',
      data: result
    });
  } catch (error) {
    logger.error('查询本地设备列表失败', { error: error.message });
    res.status(500).json({
      code: '5000000',
      msg: '查询本地设备列表失败',
      error: error.message
    });
  }
};

/**
 * 根据用户ID查询设备详情
 */
const getDeviceByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 查询本地数据库
    const device = await deviceModel.getDeviceByUserId(userId);
    
    if (!device) {
      return res.status(404).json({
        code: '4040000',
        msg: '未找到指定的设备'
      });
    }
    
    res.json({
      code: '3810000',
      msg: 'success',
      data: device
    });
  } catch (error) {
    logger.error('查询设备详情失败', { error: error.message });
    res.status(500).json({
      code: '5000000',
      msg: '查询设备详情失败',
      error: error.message
    });
  }
};

module.exports = {
  getClients,
  getClientInfo,
  getLocalDevices,
  getDeviceByUserId
}; 