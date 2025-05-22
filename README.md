# 卡池API代理服务

这是一个中间层服务，用于对接第三方卡池API，并提供额外的数据记录和查询功能。

## 功能特点

- 完全兼容原始第三方API接口
- 自动记录所有API调用和操作历史
- 保存SIM卡信息、设备信息和短信记录到本地数据库
- 提供额外的本地数据查询接口
- 详细的日志记录和监控

## 技术栈

- Node.js
- Express.js
- PostgreSQL
- Winston (日志)
- Axios (HTTP请求)

## 安装

1. 克隆仓库
```
git clone <仓库地址>
cd cardpool-proxy-service
```

2. 安装依赖
```
npm install
```

3. 设置环境变量
复制`.env.example`文件为`.env`，并根据您的环境配置相关参数：
```
cp .env.example .env
```

4. 初始化数据库
```
npm run init-db
```

## 运行

### 开发环境
```
npm run dev
```

### 生产环境
```
npm start
```

## API接口

服务提供两类接口：

### 1. 原始API接口（转发）

这些接口与原始第三方API保持完全一致：

**SIM卡相关：**
- `POST /api/outbreak/simCardsList`: 获取SIM卡列表
- `POST /api/outbreak/clientsSpilt`: 切卡
- `POST /api/outbreak/userRevuim`: 强制还卡
- `POST /api/outbreak/simpoolsDeatil`: 获取设备对应的卡

**设备相关：**
- `POST /api/outbreak/clients`: 获取接入设备列表
- `POST /api/outbreak/clientsInfo`: 获取设备详情

**短信相关：**
- `GET /api/outbreak/getSms`: 收短信
- `POST /api/outbreak/sendSms`: 发短信
- `GET /api/outbreak/sendResult`: 获取短信发送结果

### 2. 本地数据库查询接口（扩展）

这些接口用于查询本地数据库中的记录：

**SIM卡：**
- `POST /api/local/simCards`: 查询本地SIM卡列表
- `GET /api/local/simCards/:imsi`: 根据IMSI查询SIM卡详情

**设备：**
- `POST /api/local/devices`: 查询本地设备列表
- `GET /api/local/devices/:userId`: 根据用户ID查询设备详情

**短信：**
- `POST /api/local/sms`: 查询本地短信记录
- `GET /api/local/sms/:msgId`: 根据消息ID查询短信详情

## 认证

所有接口都需要在请求头中包含`key`参数进行认证，与原始API保持一致。

## 项目结构

```
├── app.js              # 应用入口
├── config/             # 配置文件
│   ├── db.js           # 数据库配置
│   └── logger.js       # 日志配置
├── controllers/        # 控制器
│   ├── simCardController.js
│   ├── deviceController.js
│   └── smsController.js
├── models/             # 数据模型
│   ├── simCardModel.js
│   ├── deviceModel.js
│   └── smsModel.js
├── routes/             # 路由定义
│   └── index.js
├── scripts/            # 脚本
│   └── init-db.js      # 数据库初始化脚本
├── utils/              # 工具函数
│   └── apiClient.js    # API调用工具
└── logs/               # 日志文件
```

## 贡献

欢迎提交问题或功能请求。如果您想贡献代码，请fork仓库并提交PR。

## 许可证

[MIT](LICENSE) 