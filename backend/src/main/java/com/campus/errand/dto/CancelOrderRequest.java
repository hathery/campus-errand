package com.campus.errand.dto;

import jakarta.validation.constraints.Size;

public record CancelOrderRequest(
        @Size(max = 100, message = "取消原因不能超过 100 字") String reason
) {
}
