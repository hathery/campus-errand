package com.campus.errand.enums;

/**
 * 钱包流水类型。
 */
public final class WalletType {

    public static final String RECHARGE = "RECHARGE";
    public static final String PAY = "PAY";
    public static final String REFUND = "REFUND";
    public static final String INCOME = "INCOME";

    private WalletType() {
    }

    public static String labelOf(String type) {
        if (type == null) {
            return "其他";
        }
        return switch (type) {
            case RECHARGE -> "余额充值";
            case PAY -> "订单支付";
            case REFUND -> "订单退款";
            case INCOME -> "跑腿收入";
            default -> type;
        };
    }
}
