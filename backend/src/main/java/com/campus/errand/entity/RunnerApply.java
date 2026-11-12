package com.campus.errand.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 跑腿员认证申请。
 */
@Data
@TableName("runner_apply")
public class RunnerApply {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String realName;

    private String studentNo;

    private String phone;

    private String reason;

    /** PENDING / APPROVED / REJECTED */
    private String status;

    private String auditRemark;

    private LocalDateTime createdAt;

    private LocalDateTime auditedAt;
}
