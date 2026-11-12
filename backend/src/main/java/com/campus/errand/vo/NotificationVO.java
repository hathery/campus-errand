package com.campus.errand.vo;

import java.time.LocalDateTime;

public record NotificationVO(
        Long id,
        String title,
        String content,
        String type,
        Integer readFlag,
        LocalDateTime createdAt
) {
}
