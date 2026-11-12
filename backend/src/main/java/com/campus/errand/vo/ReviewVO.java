package com.campus.errand.vo;

import java.time.LocalDateTime;

public record ReviewVO(
        Long id,
        Integer rating,
        String content,
        Integer anonymous,
        String reviewerName,
        LocalDateTime createdAt
) {
}
