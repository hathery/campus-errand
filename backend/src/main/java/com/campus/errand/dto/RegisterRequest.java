package com.campus.errand.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "请输入用户名")
        @Pattern(regexp = "^[a-zA-Z0-9_]{4,20}$", message = "用户名需为 4-20 位字母、数字或下划线")
        String username,

        @NotBlank(message = "请输入密码")
        @Size(min = 6, max = 20, message = "密码长度需为 6-20 位")
        String password,

        @NotBlank(message = "请输入昵称")
        @Size(max = 20, message = "昵称不能超过 20 个字符")
        String nickname,

        @NotBlank(message = "请输入手机号")
        @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
        String phone
) {
}
