package com.campus.errand.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 跑腿订单主表。
 */
@Data
@TableName("errand_order")
public class ErrandOrder {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String orderNo;

    private Long publisherId;

    private Long runnerId;

    /** EXPRESS / FOOD / PRINT / PURCHASE / OTHER */
    private String type;

    private String title;

    private String description;

    private String pickupAddress;

    private String deliveryAddress;

    private String contactName;

    private String contactPhone;

    private BigDecimal amount;

    private BigDecimal commission;

    private BigDecimal runnerIncome;

    /**
     * PENDING / ACCEPTED / PICKED_UP / DELIVERED / COMPLETED / CANCELLED
     */
    private String status;

    /** PAID / REFUNDED / SETTLED */
    private String payStatus;

    private LocalDateTime expectedTime;

    /** 0 普通，1 加急 */
    private Integer urgent;

    private BigDecimal weight;

    private LocalDateTime acceptAt;

    private LocalDateTime pickupAt;

    private LocalDateTime deliverAt;

    private LocalDateTime finishAt;

    private LocalDateTime cancelAt;

    private String cancelReason;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
