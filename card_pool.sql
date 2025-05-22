/*
 Navicat Premium Dump SQL

 Source Server         : US-30-DATA
 Source Server Type    : PostgreSQL
 Source Server Version : 120022 (120022)
 Source Host           : 104.37.187.30:5432
 Source Catalog        : cardpool_proxy
 Source Schema         : card_pool

 Target Server Type    : PostgreSQL
 Target Server Version : 120022 (120022)
 File Encoding         : 65001

 Date: 19/05/2025 19:20:49
*/


-- ----------------------------
-- Sequence structure for api_logs_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "card_pool"."api_logs_id_seq";
CREATE SEQUENCE "card_pool"."api_logs_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for devices_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "card_pool"."devices_id_seq";
CREATE SEQUENCE "card_pool"."devices_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for operation_logs_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "card_pool"."operation_logs_id_seq";
CREATE SEQUENCE "card_pool"."operation_logs_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for sim_cards_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "card_pool"."sim_cards_id_seq";
CREATE SEQUENCE "card_pool"."sim_cards_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for sms_records_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "card_pool"."sms_records_id_seq";
CREATE SEQUENCE "card_pool"."sms_records_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Table structure for api_logs
-- ----------------------------
DROP TABLE IF EXISTS "card_pool"."api_logs";
CREATE TABLE "card_pool"."api_logs" (
  "id" int4 NOT NULL DEFAULT nextval('"card_pool".api_logs_id_seq'::regclass),
  "api_path" varchar(255) COLLATE "pg_catalog"."default",
  "method" varchar(10) COLLATE "pg_catalog"."default",
  "request_headers" jsonb,
  "request_params" jsonb,
  "response_code" varchar(20) COLLATE "pg_catalog"."default",
  "response_data" jsonb,
  "client_ip" varchar(50) COLLATE "pg_catalog"."default",
  "request_time" timestamp(6),
  "response_time" timestamp(6),
  "execution_time" int4,
  "status" varchar(20) COLLATE "pg_catalog"."default",
  "error_message" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for devices
-- ----------------------------
DROP TABLE IF EXISTS "card_pool"."devices";
CREATE TABLE "card_pool"."devices" (
  "id" int4 NOT NULL DEFAULT nextval('"card_pool".devices_id_seq'::regclass),
  "device_id" varchar(100) COLLATE "pg_catalog"."default",
  "user_id" varchar(50) COLLATE "pg_catalog"."default",
  "status" int4,
  "name" varchar(100) COLLATE "pg_catalog"."default",
  "in_use" int4,
  "device_type" int4,
  "mac_address" varchar(50) COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for operation_logs
-- ----------------------------
DROP TABLE IF EXISTS "card_pool"."operation_logs";
CREATE TABLE "card_pool"."operation_logs" (
  "id" int4 NOT NULL DEFAULT nextval('"card_pool".operation_logs_id_seq'::regclass),
  "operation_type" varchar(50) COLLATE "pg_catalog"."default",
  "user_id" varchar(50) COLLATE "pg_catalog"."default",
  "imsi" varchar(50) COLLATE "pg_catalog"."default",
  "request_data" jsonb,
  "response_data" jsonb,
  "result" varchar(20) COLLATE "pg_catalog"."default",
  "remarks" text COLLATE "pg_catalog"."default",
  "operation_time" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for sim_cards
-- ----------------------------
DROP TABLE IF EXISTS "card_pool"."sim_cards";
CREATE TABLE "card_pool"."sim_cards" (
  "id" int4 NOT NULL DEFAULT nextval('"card_pool".sim_cards_id_seq'::regclass),
  "card_id" varchar(50) COLLATE "pg_catalog"."default",
  "iccid" varchar(50) COLLATE "pg_catalog"."default",
  "imsi" varchar(50) COLLATE "pg_catalog"."default",
  "mcc" varchar(10) COLLATE "pg_catalog"."default",
  "mnc" varchar(10) COLLATE "pg_catalog"."default",
  "is_activate" bool,
  "is_broken" bool,
  "is_disabled" bool,
  "is_in_simpool" bool,
  "is_in_used" bool,
  "location_in_sim_pool" int4,
  "sim_pool_mac_addr" varchar(50) COLLATE "pg_catalog"."default",
  "user_id" varchar(50) COLLATE "pg_catalog"."default",
  "name" varchar(100) COLLATE "pg_catalog"."default",
  "bind_number" varchar(50) COLLATE "pg_catalog"."default",
  "img_md5" varchar(50) COLLATE "pg_catalog"."default",
  "operator_id" varchar(50) COLLATE "pg_catalog"."default",
  "org_code" varchar(50) COLLATE "pg_catalog"."default",
  "phone_number" varchar(50) COLLATE "pg_catalog"."default",
  "update_at" int8,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "device_number" varchar(50) COLLATE "pg_catalog"."default",
  "proxy_ip" varchar(50) COLLATE "pg_catalog"."default",
  "proxy_port" int4,
  "proxy_username" varchar(50) COLLATE "pg_catalog"."default",
  "proxy_password" varchar(50) COLLATE "pg_catalog"."default",
  "vcf_url" varchar(255) COLLATE "pg_catalog"."default",
  "is_used" bool DEFAULT false,
  "registration_time" varchar(255) COLLATE "pg_catalog"."default",
  "is_registered" bool,
  "registration_failure_reason" text COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "card_pool"."sim_cards"."id" IS '主键ID';
COMMENT ON COLUMN "card_pool"."sim_cards"."card_id" IS '第三方系统中的SIM卡ID';
COMMENT ON COLUMN "card_pool"."sim_cards"."iccid" IS '集成电路卡识别码';
COMMENT ON COLUMN "card_pool"."sim_cards"."imsi" IS '国际移动用户识别码';
COMMENT ON COLUMN "card_pool"."sim_cards"."mcc" IS '移动国家代码';
COMMENT ON COLUMN "card_pool"."sim_cards"."mnc" IS '移动网络代码';
COMMENT ON COLUMN "card_pool"."sim_cards"."is_activate" IS '是否激活';
COMMENT ON COLUMN "card_pool"."sim_cards"."is_broken" IS '是否损坏';
COMMENT ON COLUMN "card_pool"."sim_cards"."is_disabled" IS '是否禁用';
COMMENT ON COLUMN "card_pool"."sim_cards"."is_in_simpool" IS '是否在SIM卡池中';
COMMENT ON COLUMN "card_pool"."sim_cards"."is_in_used" IS '是否正在使用中';
COMMENT ON COLUMN "card_pool"."sim_cards"."location_in_sim_pool" IS '在SIM卡池中的位置';
COMMENT ON COLUMN "card_pool"."sim_cards"."sim_pool_mac_addr" IS 'SIM卡池MAC地址';
COMMENT ON COLUMN "card_pool"."sim_cards"."user_id" IS '用户ID';
COMMENT ON COLUMN "card_pool"."sim_cards"."name" IS '用户名称';
COMMENT ON COLUMN "card_pool"."sim_cards"."bind_number" IS '绑定号码';
COMMENT ON COLUMN "card_pool"."sim_cards"."img_md5" IS '图像MD5';
COMMENT ON COLUMN "card_pool"."sim_cards"."operator_id" IS '运营商ID';
COMMENT ON COLUMN "card_pool"."sim_cards"."org_code" IS '组织代码';
COMMENT ON COLUMN "card_pool"."sim_cards"."phone_number" IS '电话号码';
COMMENT ON COLUMN "card_pool"."sim_cards"."update_at" IS '第三方更新时间戳';
COMMENT ON COLUMN "card_pool"."sim_cards"."created_at" IS '记录创建时间';
COMMENT ON COLUMN "card_pool"."sim_cards"."updated_at" IS '本地更新时间';
COMMENT ON COLUMN "card_pool"."sim_cards"."device_number" IS '设备编号';
COMMENT ON COLUMN "card_pool"."sim_cards"."proxy_ip" IS '代理IP地址';
COMMENT ON COLUMN "card_pool"."sim_cards"."proxy_port" IS '代理端口号';
COMMENT ON COLUMN "card_pool"."sim_cards"."proxy_username" IS '代理认证用户名';
COMMENT ON COLUMN "card_pool"."sim_cards"."proxy_password" IS '代理认证密码';
COMMENT ON COLUMN "card_pool"."sim_cards"."vcf_url" IS '通讯录VCF文件下载URL地址';
COMMENT ON COLUMN "card_pool"."sim_cards"."is_used" IS '标记SIM卡是否已被使用(TRUE=已使用,FALSE=未使用)';
COMMENT ON COLUMN "card_pool"."sim_cards"."registration_time" IS 'SIM卡注册时间戳';
COMMENT ON COLUMN "card_pool"."sim_cards"."is_registered" IS '标记SIM卡是否注册成功(TRUE=成功,FALSE=失败)';
COMMENT ON COLUMN "card_pool"."sim_cards"."registration_failure_reason" IS 'SIM卡注册失败原因描述';

-- ----------------------------
-- Table structure for sms_records
-- ----------------------------
DROP TABLE IF EXISTS "card_pool"."sms_records";
CREATE TABLE "card_pool"."sms_records" (
  "id" int4 NOT NULL DEFAULT nextval('"card_pool".sms_records_id_seq'::regclass),
  "msg_id" varchar(50) COLLATE "pg_catalog"."default",
  "sender" varchar(50) COLLATE "pg_catalog"."default",
  "receiver" varchar(50) COLLATE "pg_catalog"."default",
  "content" text COLLATE "pg_catalog"."default",
  "user_id" varchar(50) COLLATE "pg_catalog"."default",
  "imsi" varchar(50) COLLATE "pg_catalog"."default",
  "send_time" timestamp(6),
  "status" varchar(20) COLLATE "pg_catalog"."default",
  "is_outgoing" bool,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "card_pool"."api_logs_id_seq"
OWNED BY "card_pool"."api_logs"."id";
SELECT setval('"card_pool"."api_logs_id_seq"', 103, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "card_pool"."devices_id_seq"
OWNED BY "card_pool"."devices"."id";
SELECT setval('"card_pool"."devices_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "card_pool"."operation_logs_id_seq"
OWNED BY "card_pool"."operation_logs"."id";
SELECT setval('"card_pool"."operation_logs_id_seq"', 122, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "card_pool"."sim_cards_id_seq"
OWNED BY "card_pool"."sim_cards"."id";
SELECT setval('"card_pool"."sim_cards_id_seq"', 65, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "card_pool"."sms_records_id_seq"
OWNED BY "card_pool"."sms_records"."id";
SELECT setval('"card_pool"."sms_records_id_seq"', 1, false);

-- ----------------------------
-- Indexes structure for table api_logs
-- ----------------------------
CREATE INDEX "idx_api_logs_api_path" ON "card_pool"."api_logs" USING btree (
  "api_path" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_api_logs_request_time" ON "card_pool"."api_logs" USING btree (
  "request_time" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table api_logs
-- ----------------------------
ALTER TABLE "card_pool"."api_logs" ADD CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table devices
-- ----------------------------
ALTER TABLE "card_pool"."devices" ADD CONSTRAINT "devices_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table operation_logs
-- ----------------------------
CREATE INDEX "idx_operation_logs_imsi" ON "card_pool"."operation_logs" USING btree (
  "imsi" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_operation_logs_operation_type" ON "card_pool"."operation_logs" USING btree (
  "operation_type" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_operation_logs_user_id" ON "card_pool"."operation_logs" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table operation_logs
-- ----------------------------
ALTER TABLE "card_pool"."operation_logs" ADD CONSTRAINT "operation_logs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table sim_cards
-- ----------------------------
CREATE INDEX "idx_sim_cards_user_id" ON "card_pool"."sim_cards" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table sim_cards
-- ----------------------------
ALTER TABLE "card_pool"."sim_cards" ADD CONSTRAINT "sim_cards_imsi_key" UNIQUE ("imsi");

-- ----------------------------
-- Primary Key structure for table sim_cards
-- ----------------------------
ALTER TABLE "card_pool"."sim_cards" ADD CONSTRAINT "sim_cards_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table sms_records
-- ----------------------------
CREATE INDEX "idx_sms_records_imsi" ON "card_pool"."sms_records" USING btree (
  "imsi" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_sms_records_user_id" ON "card_pool"."sms_records" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table sms_records
-- ----------------------------
ALTER TABLE "card_pool"."sms_records" ADD CONSTRAINT "sms_records_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table operation_logs
-- ----------------------------
ALTER TABLE "card_pool"."operation_logs" ADD CONSTRAINT "operation_logs_imsi_fkey" FOREIGN KEY ("imsi") REFERENCES "card_pool"."sim_cards" ("imsi") ON DELETE SET NULL ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table sms_records
-- ----------------------------
ALTER TABLE "card_pool"."sms_records" ADD CONSTRAINT "sms_records_imsi_fkey" FOREIGN KEY ("imsi") REFERENCES "card_pool"."sim_cards" ("imsi") ON DELETE SET NULL ON UPDATE NO ACTION;
