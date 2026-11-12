package com.campus.errand.vo;

import com.campus.errand.enums.WalletType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WalletTxnVO(
        Long id,
        Long orderId,
        String type,
        String typeLabel,
        BigDecimal amount,
        BigDecimal balanceAfter,
        String remark,
        LocalDateTime createdAt
) {
    public static WalletTxnVO of(com.campus.errand.entity.WalletTxn txn) {
        return new WalletTxnVO(
                txn.getId(),
                txn.getOrderId(),
                txn.getType(),
                WalletType.labelOf(txn.getType()),
                txn.getAmount(),
                txn.getBalanceAfter(),
                txn.getRemark(),
                txn.getCreatedAt()
        );
    }
}
