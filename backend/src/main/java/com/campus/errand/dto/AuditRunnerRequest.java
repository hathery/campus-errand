package com.campus.errand.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuditRunnerRequest(
        @NotBlank(message = "请选择审核结果") String status,
        @Size(max = 200, message = "审核备注不能超过 200 字") String remark
) {
}
