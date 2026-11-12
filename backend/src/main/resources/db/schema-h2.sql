CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(32) NOT NULL,
    password VARCHAR(100) NOT NULL,
    nickname VARCHAR(32) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(64),
    avatar VARCHAR(255),
    role VARCHAR(16) NOT NULL DEFAULT 'USER',
    runner_status TINYINT NOT NULL DEFAULT 0,
    credit_score INT NOT NULL DEFAULT 100,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT uk_user_username UNIQUE (username),
    CONSTRAINT uk_user_phone UNIQUE (phone)
);

CREATE TABLE IF NOT EXISTS runner_apply (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    real_name VARCHAR(32) NOT NULL,
    student_no VARCHAR(32) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    reason VARCHAR(255),
    status VARCHAR(16) NOT NULL,
    audit_remark VARCHAR(255),
    created_at DATETIME NOT NULL,
    audited_at DATETIME,
    CONSTRAINT uk_runner_apply_user UNIQUE (user_id),
    CONSTRAINT fk_runner_apply_user FOREIGN KEY (user_id) REFERENCES sys_user (id)
);

CREATE TABLE IF NOT EXISTS errand_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(32) NOT NULL,
    publisher_id BIGINT NOT NULL,
    runner_id BIGINT,
    type VARCHAR(16) NOT NULL,
    title VARCHAR(64) NOT NULL,
    description VARCHAR(512),
    pickup_address VARCHAR(128) NOT NULL,
    delivery_address VARCHAR(128) NOT NULL,
    contact_name VARCHAR(32) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    commission DECIMAL(10, 2) NOT NULL,
    runner_income DECIMAL(10, 2) NOT NULL,
    status VARCHAR(16) NOT NULL,
    pay_status VARCHAR(16) NOT NULL,
    expected_time DATETIME NOT NULL,
    urgent TINYINT NOT NULL DEFAULT 0,
    weight DECIMAL(6, 2) NOT NULL DEFAULT 1.00,
    accept_at DATETIME,
    pickup_at DATETIME,
    deliver_at DATETIME,
    finish_at DATETIME,
    cancel_at DATETIME,
    cancel_reason VARCHAR(255),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT uk_order_no UNIQUE (order_no),
    CONSTRAINT fk_order_publisher FOREIGN KEY (publisher_id) REFERENCES sys_user (id),
    CONSTRAINT fk_order_runner FOREIGN KEY (runner_id) REFERENCES sys_user (id)
);

CREATE TABLE IF NOT EXISTS order_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    operator_id BIGINT NOT NULL,
    action VARCHAR(32) NOT NULL,
    from_status VARCHAR(16),
    to_status VARCHAR(16) NOT NULL,
    remark VARCHAR(255),
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_order_log_order FOREIGN KEY (order_id) REFERENCES errand_order (id)
);

CREATE TABLE IF NOT EXISTS review (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    reviewee_id BIGINT NOT NULL,
    rating TINYINT NOT NULL,
    content VARCHAR(512),
    anonymous TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    CONSTRAINT uk_review_order UNIQUE (order_id),
    CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES errand_order (id),
    CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES sys_user (id),
    CONSTRAINT fk_review_reviewee FOREIGN KEY (reviewee_id) REFERENCES sys_user (id)
);

CREATE TABLE IF NOT EXISTS wallet_txn (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    order_id BIGINT,
    type VARCHAR(16) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    remark VARCHAR(255),
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES sys_user (id)
);

CREATE TABLE IF NOT EXISTS notification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(64) NOT NULL,
    content VARCHAR(512) NOT NULL,
    type VARCHAR(16) NOT NULL,
    read_flag TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES sys_user (id)
);

CREATE INDEX IF NOT EXISTS idx_order_status ON errand_order (status);
CREATE INDEX IF NOT EXISTS idx_order_publisher ON errand_order (publisher_id);
CREATE INDEX IF NOT EXISTS idx_order_runner ON errand_order (runner_id);
CREATE INDEX IF NOT EXISTS idx_order_created ON errand_order (created_at);
CREATE INDEX IF NOT EXISTS idx_order_log_order ON order_log (order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_txn (user_id);
CREATE INDEX IF NOT EXISTS idx_notification_user ON notification (user_id, read_flag);
