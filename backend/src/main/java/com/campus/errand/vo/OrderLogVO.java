package com.campus.errand.vo;

import com.campus.errand.entity.OrderLog;

import java.time.LocalDateTime;

public record OrderLogVO(
        Long id,
        String action,
        String actionLabel,
        String fromStatus,
        String fromStatusLabel,
        String toStatus,
        String toStatusLabel,
        String remark,
        LocalDateTime createdAt
) {
    public static OrderLogVO from(OrderLog log) {
        return new OrderLogVO(
                log.getId(),
                log.getAction(),
                actionLabel(log.getAction()),
                log.getFromStatus(),
                com.campus.errand.enums.OrderStatus.labelOf(log.getFromStatus()),
                log.getToStatus(),
                com.campus.errand.enums.OrderStatus.labelOf(log.getToStatus()),
                log.getRemark(),
                log.getCreatedAt()
        );
    }

    private static String actionLabel(String action) {
        if (action == null) {
            return "订单更新";
        }
        return switch (action) {
            case "CREATE" -> "发布订单";
            case "ACCEPT" -> "跑腿员接单";
            case "PICKUP" -> "确认取件";
            case "DELIVER" -> "确认送达";
            case "COMPLETE" -> "确认完成";
            case "CANCEL" -> "取消订单";
            case "ADMIN_CANCEL" -> "管理员取消";
            case "REVIEW" -> "发表评价";
            default -> action;
        };
    }
}
