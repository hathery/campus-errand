package com.campus.errand.enums;

/**
 * 订单状态常量与展示文案。
 */
public final class OrderStatus {

    public static final String PENDING = "PENDING";
    public static final String ACCEPTED = "ACCEPTED";
    public static final String PICKED_UP = "PICKED_UP";
    public static final String DELIVERED = "DELIVERED";
    public static final String COMPLETED = "COMPLETED";
    public static final String CANCELLED = "CANCELLED";

    private OrderStatus() {
    }

    public static String labelOf(String status) {
        if (status == null) {
            return "未知";
        }
        return switch (status) {
            case PENDING -> "待接单";
            case ACCEPTED -> "已接单";
            case PICKED_UP -> "配送中";
            case DELIVERED -> "已送达";
            case COMPLETED -> "已完成";
            case CANCELLED -> "已取消";
            default -> status;
        };
    }

    public static boolean isFinished(String status) {
        return COMPLETED.equals(status) || CANCELLED.equals(status);
    }
}
