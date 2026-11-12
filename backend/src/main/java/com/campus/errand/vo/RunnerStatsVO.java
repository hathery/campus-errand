package com.campus.errand.vo;

import java.math.BigDecimal;

public record RunnerStatsVO(
        long completedOrders,
        BigDecimal totalIncome,
        double averageRating,
        int creditScore
) {
}
