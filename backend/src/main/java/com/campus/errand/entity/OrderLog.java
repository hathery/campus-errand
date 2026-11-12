package com.campus.errand.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 订单状态流转日志，用于订单详情页时间轴与审计。
 */
@Data
@TableName("order_log")
public class OrderLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long orderId;

    private Long operatorId;

    private String action;

    private String fromStatus;

    private String toStatus;

    private String remark;

    private LocalDateTime createdAt;
}
