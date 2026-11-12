package com.campus.errand.vo;

public record PublicStatsVO(long userCount, long orderCount, long completedCount, double completionRate) {
}
