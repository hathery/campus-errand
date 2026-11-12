package com.campus.errand.vo;

import com.campus.errand.entity.OrderLog;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 订单视图对象，聚合发布者/跑腿员昵称、状态文案、操作权限与时间轴。
 */
@Data
public class OrderVO {

    private Long id;
    private String orderNo;
    private String type;
    private String typeLabel;
    private String title;
    private String description;
    private String pickupAddress;
    private String deliveryAddress;
    private String contactName;
    private String contactPhone;
    private java.math.BigDecimal amount;
    private java.math.BigDecimal commission;
    private java.math.BigDecimal runnerIncome;
    private String status;
    private String statusLabel;
    private String payStatus;
    private String payStatusLabel;
    private LocalDateTime expectedTime;
    private Integer urgent;
    private java.math.BigDecimal weight;

    private Long publisherId;
    private String publisherName;
    private String publisherAvatar;
    private Long runnerId;
    private String runnerName;
    private String runnerAvatar;

    private LocalDateTime createdAt;
    private LocalDateTime acceptAt;
    private LocalDateTime pickupAt;
    private LocalDateTime deliverAt;
    private LocalDateTime finishAt;
    private LocalDateTime cancelAt;
    private String cancelReason;

    private boolean canAccept;
    private boolean canCancel;
    private boolean canPickup;
    private boolean canDeliver;
    private boolean canComplete;
    private boolean canReview;
    private boolean reviewed;

    private ReviewVO review;
    private List<OrderLogVO> logs;
}
