package com.campus.errand.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 钱包流水。所有余额变动均写入该表，保证资金可追溯。
 */
@Data
@TableName("wallet_txn")
public class WalletTxn {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long orderId;

    /** RECHARGE / PAY / REFUND / INCOME */
    private String type;

    private BigDecimal amount;

    private BigDecimal balanceAfter;

    private String remark;

    private LocalDateTime createdAt;
}
