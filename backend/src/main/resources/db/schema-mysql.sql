CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户主键',
    username VARCHAR(32) NOT NULL COMMENT '登录账号',
    password VARCHAR(100) NOT NULL COMMENT 'BCrypt 密码',
    nickname VARCHAR(32) NOT NULL COMMENT '昵称',
    phone VARCHAR(20) NOT NULL COMMENT '手机号',
    email VARCHAR(64) DEFAULT NULL COMMENT '邮箱',
    avatar VARCHAR(255) DEFAULT NULL COMMENT '头像地址',
    role VARCHAR(16) NOT NULL DEFAULT 'USER' COMMENT 'USER/ADMIN',
    runner_status TINYINT NOT NULL DEFAULT 0 COMMENT '0未申请1审核中2已通过3已驳回',
    credit_score INT NOT NULL DEFAULT 100 COMMENT '信用分',
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '钱包余额',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '1正常0禁用',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_username (username),
    UNIQUE KEY uk_user_phone (phone),
    KEY idx_user_runner_status (runner_status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户表';

CREATE TABLE IF NOT EXISTS runner_apply (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    real_name VARCHAR(32) NOT NULL COMMENT '真实姓名',
    student_no VARCHAR(32) NOT NULL COMMENT '学号',
    phone VARCHAR(20) NOT NULL,
    reason VARCHAR(255) DEFAULT NULL,
    status VARCHAR(16) NOT NULL COMMENT 'PENDING/APPROVED/REJECTED',
    audit_remark VARCHAR(255) DEFAULT NULL,
    created_at DATETIME NOT NULL,
    audited_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_runner_apply_user (user_id),
    KEY idx_apply_status (status),
    CONSTRAINT fk_runner_apply_user FOREIGN KEY (user_id) REFERENCES sys_user (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '跑腿员认证申请表';

CREATE TABLE IF NOT EXISTS errand_order (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_no VARCHAR(32) NOT NULL COMMENT '业务订单号',
    publisher_id BIGINT NOT NULL COMMENT '发布者',
    runner_id BIGINT DEFAULT NULL COMMENT '接单跑腿员',
    type VARCHAR(16) NOT NULL COMMENT '订单类型',
    title VARCHAR(64) NOT NULL,
    description VARCHAR(512) DEFAULT NULL,
    pickup_address VARCHAR(128) NOT NULL,
    delivery_address VARCHAR(128) NOT NULL,
    contact_name VARCHAR(32) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL COMMENT '订单总额',
    commission DECIMAL(10, 2) NOT NULL COMMENT '平台服务费',
    runner_income DECIMAL(10, 2) NOT NULL COMMENT '跑腿员实收',
    status VARCHAR(16) NOT NULL COMMENT '订单状态',
    pay_status VARCHAR(16) NOT NULL COMMENT '支付状态',
    expected_time DATETIME NOT NULL,
    urgent TINYINT NOT NULL DEFAULT 0,
    weight DECIMAL(6, 2) NOT NULL DEFAULT 1.00,
    accept_at DATETIME DEFAULT NULL,
    pickup_at DATETIME DEFAULT NULL,
    deliver_at DATETIME DEFAULT NULL,
    finish_at DATETIME DEFAULT NULL,
    cancel_at DATETIME DEFAULT NULL,
    cancel_reason VARCHAR(255) DEFAULT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_order_no (order_no),
    KEY idx_order_status (status),
    KEY idx_order_publisher (publisher_id),
    KEY idx_order_runner (runner_id),
    KEY idx_order_created (created_at),
    CONSTRAINT fk_order_publisher FOREIGN KEY (publisher_id) REFERENCES sys_user (id),
    CONSTRAINT fk_order_runner FOREIGN KEY (runner_id) REFERENCES sys_user (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '跑腿订单表';

CREATE TABLE IF NOT EXISTS order_log (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    operator_id BIGINT NOT NULL,
    action VARCHAR(32) NOT NULL,
    from_status VARCHAR(16) DEFAULT NULL,
    to_status VARCHAR(16) NOT NULL,
    remark VARCHAR(255) DEFAULT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_order_log_order (order_id),
    CONSTRAINT fk_order_log_order FOREIGN KEY (order_id) REFERENCES errand_order (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '订单状态日志表';

CREATE TABLE IF NOT EXISTS review (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    reviewee_id BIGINT NOT NULL,
    rating TINYINT NOT NULL,
    content VARCHAR(512) DEFAULT NULL,
    anonymous TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_review_order (order_id),
    KEY idx_review_reviewee (reviewee_id),
    CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES errand_order (id),
    CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES sys_user (id),
    CONSTRAINT fk_review_reviewee FOREIGN KEY (reviewee_id) REFERENCES sys_user (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '订单评价表';

CREATE TABLE IF NOT EXISTS wallet_txn (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    order_id BIGINT DEFAULT NULL,
    type VARCHAR(16) NOT NULL COMMENT 'RECHARGE/PAY/REFUND/INCOME',
    amount DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    remark VARCHAR(255) DEFAULT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_wallet_user (user_id),
    KEY idx_wallet_order (order_id),
    CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES sys_user (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '钱包流水表';

CREATE TABLE IF NOT EXISTS notification (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(64) NOT NULL,
    content VARCHAR(512) NOT NULL,
    type VARCHAR(16) NOT NULL,
    read_flag TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_notification_user (user_id, read_flag),
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES sys_user (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '站内通知表';
