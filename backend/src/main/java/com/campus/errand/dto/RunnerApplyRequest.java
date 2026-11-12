package com.campus.errand.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RunnerApplyRequest(
        @NotBlank(message = "请输入真实姓名")
        @Size(max = 20, message = "姓名过长")
        String realName,

        @NotBlank(message = "请输入学号")
        @Pattern(regexp = "^[0-9A-Za-z]{6,20}$", message = "学号格式不正确")
        String studentNo,

        @NotBlank(message = "请输入联系电话")
        @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
        String phone,

        @Size(max = 200, message = "申请理由不能超过 200 字")
        String reason
) {
}
