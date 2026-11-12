package com.campus.errand.vo;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminUserVO(
        Long id,
        String username,
        String nickname,
        String phone,
        String avatar,
        String role,
        Integer runnerStatus,
        String runnerStatusLabel,
        Integer creditScore,
        BigDecimal balance,
        Integer status,
        LocalDateTime createdAt
) {
}
