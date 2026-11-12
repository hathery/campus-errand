package com.campus.errand.enums;

import java.math.BigDecimal;
import java.util.Arrays;

/**
 * 跑腿业务类型及基础配送费。
 */
public enum OrderType {

    EXPRESS("取快递", new BigDecimal("3.00")),
    FOOD("代买餐食", new BigDecimal("4.00")),
    PRINT("打印代办", new BigDecimal("3.00")),
    PURCHASE("代购物品", new BigDecimal("5.00")),
    OTHER("其他帮忙", new BigDecimal("4.00"));

    private final String label;
    private final BigDecimal baseFee;

    OrderType(String label, BigDecimal baseFee) {
        this.label = label;
        this.baseFee = baseFee;
    }

    public String getLabel() {
        return label;
    }

    public BigDecimal getBaseFee() {
        return baseFee;
    }

    public static OrderType of(String value) {
        return Arrays.stream(values())
                .filter(item -> item.name().equalsIgnoreCase(value))
                .findFirst()
                .orElse(null);
    }

    public static String labelOf(String value) {
        OrderType type = of(value);
        return type == null ? "其他" : type.getLabel();
    }
}
