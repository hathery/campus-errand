package com.campus.errand.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 20, message = "昵称不能超过 20 个字符") String nickname,
        @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确") String phone,
        @Email(message = "邮箱格式不正确") @Size(max = 64, message = "邮箱过长") String email,
        @Size(max = 255, message = "头像地址过长") String avatar
) {
}
