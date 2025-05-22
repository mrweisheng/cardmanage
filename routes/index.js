const express = require('express');
const router = express.Router();
const simCardController = require('../controllers/simCardController');
const deviceController = require('../controllers/deviceController');
const smsController = require('../controllers/smsController');

// 中间件 - 检查请求头是否包含key
const checkApiKey = (req, res, next) => {
  const apiKey = req.headers.key;
  
  if (!apiKey) {
    return res.status(401).json({
      code: '4010000',
      msg: '未提供API密钥'
    });
  }
  
  // 在实际应用中可能还需要验证API密钥是否有效
  // 此处简化处理，只检查是否存在
  next();
};

// API路由
// 所有路由都需要API密钥验证
router.use(checkApiKey);

// SIM卡相关路由
// 完全与第三方API保持一致的路由
router.post('/outbreak/simCardsList', simCardController.getSimCards);
router.post('/outbreak/clientsSpilt', simCardController.clientsSpilt);
router.post('/outbreak/userRevuim', simCardController.userRevuim);
router.post('/outbreak/simpoolsDeatil', simCardController.simpoolsDeatil);

// 设备相关路由
router.post('/outbreak/clients', deviceController.getClients);
router.post('/outbreak/clientsInfo', deviceController.getClientInfo);

// 短信相关路由
router.get('/outbreak/getSms', smsController.getSms);
router.post('/outbreak/sendSms', smsController.sendSms);
router.get('/outbreak/sendResult', smsController.getSendResult);

// 自定义扩展路由，用于查询本地数据库
// SIM卡
router.post('/local/simCards', simCardController.getLocalSimCards);
router.get('/local/simCards/:imsi', simCardController.getSimCardByImsi);

// 设备
router.post('/local/devices', deviceController.getLocalDevices);
router.get('/local/devices/:userId', deviceController.getDeviceByUserId);

// 短信
router.post('/local/sms', smsController.getSmsRecords);
router.get('/local/sms/:msgId', smsController.getSmsRecordByMsgId);

module.exports = router; 