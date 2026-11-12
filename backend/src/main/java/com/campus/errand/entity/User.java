package com.campus.errand.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 系统用户。发布者与跑腿员共用一张用户表，通过 runnerStatus 区分跑腿身份。
 */
@Data
@TableName("sys_user")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private String password;

    private String nickname;

    private String phone;

    private String email;

    private String avatar;

    /** USER / ADMIN */
    private String role;

    /** 0 未申请，1 审核中，2 已通过，3 已驳回 */
    private Integer runnerStatus;

    private Integer creditScore;

    private BigDecimal balance;

    /** 1 正常，0 禁用 */
    private Integer status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
