const axios = require('axios');
const FormData = require('form-data');
const { logger } = require('../config/logger');
const db = require('../config/db');
require('dotenv').config();

// 创建基础axios实例
const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 10000,
  headers: {
    'key': process.env.API_KEY,
  }
});

// 记录API调用日志到数据库
const logApiCall = async (apiPath, method, requestHeaders, requestParams, responseCode, responseData, clientIp, requestTime, responseTime, status, errorMessage = null) => {
  try {
    const executionTime = responseTime - requestTime;
    
    await db.query(
      `INSERT INTO card_pool.api_logs
       (api_path, method, request_headers, request_params, response_code, response_data, 
        client_ip, request_time, response_time, execution_time, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        apiPath,
        method,
        JSON.stringify(requestHeaders),
        JSON.stringify(requestParams),
        responseCode,
        JSON.stringify(responseData),
        clientIp,
        new Date(requestTime),
        new Date(responseTime),
        executionTime,
        status,
        errorMessage
      ]
    );
  } catch (err) {
    logger.error('记录API调用日志失败', { error: err.message });
  }
};

// 记录操作日志
const logOperation = async (operationType, userId, imsi, requestData, responseData, result, remarks = null) => {
  try {
    await db.query(
      `INSERT INTO card_pool.operation_logs
       (operation_type, user_id, imsi, request_data, response_data, result, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        operationType,
        userId,
        imsi,
        JSON.stringify(requestData),
        JSON.stringify(responseData),
        result,
        remarks
      ]
    );
  } catch (err) {
    logger.error('记录操作日志失败', { error: err.message });
  }
};

// JSON格式请求的API调用
const callApi = async (method, endpoint, data, headers = {}, clientIp = null) => {
  const requestTime = Date.now();
  try {
    const response = await apiClient({
      method,
      url: endpoint,
      data: method !== 'GET' ? data : undefined,
      params: method === 'GET' ? data : undefined,
      headers: {
        ...apiClient.defaults.headers,
        ...headers
      }
    });

    const responseTime = Date.now();
    
    // 记录API调用日志
    await logApiCall(
      endpoint,
      method,
      headers,
      data,
      response.data?.code || '200',
      response.data,
      clientIp,
      requestTime,
      responseTime,
      'success'
    );

    return response.data;
  } catch (error) {
    const responseTime = Date.now();
    const errorResponse = error.response?.data || {};
    const errorStatus = error.response?.status || 500;
    
    // 记录API调用错误
    await logApiCall(
      endpoint,
      method,
      headers,
      data,
      String(errorStatus),
      errorResponse,
      clientIp,
      requestTime,
      responseTime,
      'failed',
      error.message
    );

    logger.error('API调用失败', {
      method,
      endpoint,
      error: error.message,
      errorResponse
    });
    
    throw error;
  }
};

// Multipart表单请求的API调用
const callApiWithFormData = async (endpoint, formData, clientIp = null) => {
  const requestTime = Date.now();
  try {
    const form = new FormData();
    
    // 将数据添加到表单
    for (const [key, value] of Object.entries(formData)) {
      form.append(key, value);
    }

    const response = await apiClient.post(endpoint, form, {
      headers: {
        ...form.getHeaders(),
        'key': process.env.API_KEY
      }
    });

    const responseTime = Date.now();
    
    // 记录API调用日志
    await logApiCall(
      endpoint,
      'POST',
      { 'Content-Type': 'multipart/form-data' },
      formData,
      response.data?.code || '200',
      response.data,
      clientIp,
      requestTime,
      responseTime,
      'success'
    );

    return response.data;
  } catch (error) {
    const responseTime = Date.now();
    const errorResponse = error.response?.data || {};
    const errorStatus = error.response?.status || 500;
    
    // 记录API调用错误
    await logApiCall(
      endpoint,
      'POST',
      { 'Content-Type': 'multipart/form-data' },
      formData,
      String(errorStatus),
      errorResponse,
      clientIp,
      requestTime,
      responseTime,
      'failed',
      error.message
    );

    logger.error('表单API调用失败', {
      endpoint,
      error: error.message,
      errorResponse
    });
    
    throw error;
  }
};

module.exports = {
  callApi,
  callApiWithFormData,
  logOperation
}; 