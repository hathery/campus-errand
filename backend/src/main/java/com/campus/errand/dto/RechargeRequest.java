package com.campus.errand.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record RechargeRequest(
        @NotNull(message = "请输入充值金额")
        @DecimalMin(value = "0.01", message = "充值金额必须大于 0")
        @DecimalMax(value = "10000.00", message = "单次充值不能超过 10000 元")
        BigDecimal amount
) {
}
