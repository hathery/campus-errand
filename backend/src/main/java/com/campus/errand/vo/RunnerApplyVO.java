package com.campus.errand.vo;

import java.time.LocalDateTime;

public record RunnerApplyVO(
        Long id,
        Long userId,
        String username,
        String nickname,
        String avatar,
        String realName,
        String studentNo,
        String phone,
        String reason,
        String status,
        String statusLabel,
        String auditRemark,
        LocalDateTime createdAt,
        LocalDateTime auditedAt
) {
}
