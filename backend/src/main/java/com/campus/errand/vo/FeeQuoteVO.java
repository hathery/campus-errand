package com.campus.errand.vo;

import java.math.BigDecimal;

/**
 * 费用试算结果，前端在发布订单前实时展示费用构成。
 */
public record FeeQuoteVO(
        String type,
        String typeLabel,
        BigDecimal baseFee,
        BigDecimal urgentFee,
        BigDecimal weightFee,
        BigDecimal total,
        String ruleText
) {
}
