package com.campus.errand.enums;

/**
 * 跑腿员认证状态。
 */
public final class RunnerStatus {

    public static final int NONE = 0;
    public static final int PENDING = 1;
    public static final int APPROVED = 2;
    public static final int REJECTED = 3;

    private RunnerStatus() {
    }

    public static String labelOf(Integer status) {
        if (status == null) {
            return "未申请";
        }
        return switch (status) {
            case NONE -> "未申请";
            case PENDING -> "审核中";
            case APPROVED -> "已认证";
            case REJECTED -> "已驳回";
            default -> "未知";
        };
    }
}
