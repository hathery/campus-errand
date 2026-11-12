package com.campus.errand.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewRequest(
        @NotNull(message = "请选择评分")
        @Min(value = 1, message = "评分最低为 1 分")
        @Max(value = 5, message = "评分最高为 5 分")
        Integer rating,

        @Size(max = 300, message = "评价内容不能超过 300 字")
        String content,

        Integer anonymous
) {
}
