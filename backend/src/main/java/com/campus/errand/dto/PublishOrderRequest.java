package com.campus.errand.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PublishOrderRequest(
        @NotBlank(message = "请选择跑腿类型")
        String type,

        @NotBlank(message = "请输入订单标题")
        @Size(max = 50, message = "标题不能超过 50 个字符")
        String title,

        @Size(max = 300, message = "备注不能超过 300 个字符")
        String description,

        @NotBlank(message = "请输入取件地址")
        @Size(max = 100, message = "取件地址过长")
        String pickupAddress,

        @NotBlank(message = "请输入送达地址")
        @Size(max = 100, message = "送达地址过长")
        String deliveryAddress,

        @NotBlank(message = "请输入联系人")
        @Size(max = 20, message = "联系人过长")
        String contactName,

        @NotBlank(message = "请输入联系电话")
        @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
        String contactPhone,

        @NotNull(message = "请选择期望送达时间")
        @Future(message = "期望送达时间必须晚于当前时间")
        LocalDateTime expectedTime,

        @NotNull(message = "请选择是否加急")
        Integer urgent,

        @NotNull(message = "请输入物品重量")
        @DecimalMin(value = "0.1", message = "重量至少为 0.1kg")
        @DecimalMax(value = "50.0", message = "重量不能超过 50kg")
        BigDecimal weight
) {
}
