package com.campus.errand.vo;

import java.math.BigDecimal;
import java.util.List;

/**
 * 管理端首页聚合数据。
 */
public record DashboardVO(
        long userCount,
        long runnerCount,
        long orderCount,
        long todayOrderCount,
        long completedOrderCount,
        BigDecimal turnover,
        long pendingApplyCount,
        List<TrendPoint> trend,
        List<TypePoint> typeDistribution,
        List<OrderVO> latestOrders
) {
    public record TrendPoint(String date, long count) {
    }

    public record TypePoint(String type, String label, long count) {
    }
}
