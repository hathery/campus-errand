package com.campus.errand.enums;

/**
 * 支付状态：已支付托管、已退款、已结算给跑腿员。
 */
public final class PayStatus {

    public static final String PAID = "PAID";
    public static final String REFUNDED = "REFUNDED";
    public static final String SETTLED = "SETTLED";

    private PayStatus() {
    }

    public static String labelOf(String status) {
        if (status == null) {
            return "未支付";
        }
        return switch (status) {
            case PAID -> "已支付";
            case REFUNDED -> "已退款";
            case SETTLED -> "已结算";
            default -> status;
        };
    }
}
