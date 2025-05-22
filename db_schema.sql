-- 创建专用的数据库架构（Schema）
CREATE SCHEMA IF NOT EXISTS card_pool;

-- SIM卡信息表
CREATE TABLE IF NOT EXISTS card_pool.sim_cards (
    id SERIAL PRIMARY KEY,
    card_id VARCHAR(50),      -- 第三方系统中的SIM卡ID
    iccid VARCHAR(50),        -- 集成电路卡识别码
    imsi VARCHAR(50),         -- 国际移动用户识别码
    mcc VARCHAR(10),          -- 移动国家代码
    mnc VARCHAR(10),          -- 移动网络代码
    is_activate BOOLEAN,      -- 是否激活
    is_broken BOOLEAN,        -- 是否损坏
    is_disabled BOOLEAN,      -- 是否禁用
    is_in_simpool BOOLEAN,    -- 是否在SIM卡池中
    location_in_sim_pool INTEGER, -- 在SIM卡池中的位置
    sim_pool_mac_addr VARCHAR(50), -- SIM卡池MAC地址
    user_id VARCHAR(50),      -- 用户ID
    name VARCHAR(100),        -- 用户名称
    bind_number VARCHAR(50),  -- 绑定号码
    img_md5 VARCHAR(50),      -- 图像MD5
    operator_id VARCHAR(50),  -- 运营商ID
    org_code VARCHAR(50),     -- 组织代码
    phone_number VARCHAR(50), -- 电话号码
    update_at BIGINT,         -- 第三方更新时间戳
    device_number VARCHAR(50),        -- 设备编号
    proxy_ip VARCHAR(50),             -- 代理IP地址
    proxy_port INTEGER,               -- 代理端口号
    proxy_username VARCHAR(50),       -- 代理认证用户名
    proxy_password VARCHAR(50),       -- 代理认证密码
    vcf_url VARCHAR(255),             -- 通讯录VCF文件下载URL地址
    is_used BOOLEAN DEFAULT FALSE,    -- 标记SIM卡是否已被使用(TRUE=已使用,FALSE=未使用)
    registration_time TIMESTAMP,      -- SIM卡注册时间戳
    is_registered BOOLEAN,            -- 标记SIM卡是否注册成功(TRUE=成功,FALSE=失败)
    registration_failure_reason TEXT, -- SIM卡注册失败原因描述
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 记录创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 本地更新时间
    UNIQUE(imsi)              -- 使用IMSI作为唯一索引
);

-- API调用日志表
CREATE TABLE IF NOT EXISTS card_pool.api_logs (
    id SERIAL PRIMARY KEY,
    api_path VARCHAR(255),    -- API路径
    method VARCHAR(10),       -- HTTP方法
    request_headers JSONB,    -- 请求头（JSON格式）
    request_params JSONB,     -- 请求参数（JSON格式）
    response_code VARCHAR(20),-- 响应代码
    response_data JSONB,      -- 响应数据（JSON格式）
    client_ip VARCHAR(50),    -- 客户端IP
    request_time TIMESTAMP,   -- 请求时间
    response_time TIMESTAMP,  -- 响应时间
    execution_time INTEGER,   -- 执行时间（毫秒）
    status VARCHAR(20),       -- 状态（成功/失败）
    error_message TEXT,       -- 错误信息
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 操作记录表
CREATE TABLE IF NOT EXISTS card_pool.operation_logs (
    id SERIAL PRIMARY KEY,
    operation_type VARCHAR(50), -- 操作类型（如"切卡"、"还卡"等）
    user_id VARCHAR(50),      -- 用户ID
    imsi VARCHAR(50),         -- 操作的SIM卡IMSI
    request_data JSONB,       -- 请求数据
    response_data JSONB,      -- 响应数据
    result VARCHAR(20),       -- 操作结果（成功/失败）
    remarks TEXT,             -- 备注
    operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (imsi) REFERENCES card_pool.sim_cards(imsi) ON DELETE SET NULL
);

-- 设备信息表
CREATE TABLE IF NOT EXISTS card_pool.devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100),   -- 设备ID
    user_id VARCHAR(50),      -- 用户ID
    status INTEGER,           -- 状态码
    name VARCHAR(100),        -- 设备名称
    in_use INTEGER,           -- 使用状态
    device_type INTEGER,      -- 设备类型
    mac_address VARCHAR(50),  -- MAC地址
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 短信记录表
CREATE TABLE IF NOT EXISTS card_pool.sms_records (
    id SERIAL PRIMARY KEY,
    msg_id VARCHAR(50),       -- 短信ID
    sender VARCHAR(50),       -- 发送方
    receiver VARCHAR(50),     -- 接收方
    content TEXT,             -- 短信内容
    user_id VARCHAR(50),      -- 关联的用户ID
    imsi VARCHAR(50),         -- 关联的IMSI
    send_time TIMESTAMP,      -- 发送时间
    status VARCHAR(20),       -- 状态
    is_outgoing BOOLEAN,      -- 是发送(true)还是接收(false)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (imsi) REFERENCES card_pool.sim_cards(imsi) ON DELETE SET NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_sim_cards_user_id ON card_pool.sim_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_api_path ON card_pool.api_logs(api_path);
CREATE INDEX IF NOT EXISTS idx_api_logs_request_time ON card_pool.api_logs(request_time);
CREATE INDEX IF NOT EXISTS idx_operation_logs_operation_type ON card_pool.operation_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_operation_logs_user_id ON card_pool.operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_imsi ON card_pool.operation_logs(imsi);
CREATE INDEX IF NOT EXISTS idx_sms_records_user_id ON card_pool.sms_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_records_imsi ON card_pool.sms_records(imsi);
