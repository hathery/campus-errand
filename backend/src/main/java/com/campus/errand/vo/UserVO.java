package com.campus.errand.vo;

import com.campus.errand.entity.User;
import com.campus.errand.enums.RunnerStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 返回给前端的用户信息，绝不包含密码字段。
 */
public record UserVO(
        Long id,
        String username,
        String nickname,
        String phone,
        String email,
        String avatar,
        String role,
        Integer runnerStatus,
        String runnerStatusLabel,
        Integer creditScore,
        BigDecimal balance,
        Integer status,
        LocalDateTime createdAt
) {
    public static UserVO from(User user) {
        if (user == null) {
            return null;
        }
        return new UserVO(
                user.getId(),
                user.getUsername(),
                user.getNickname(),
                user.getPhone(),
                user.getEmail(),
                user.getAvatar(),
                user.getRole(),
                user.getRunnerStatus(),
                RunnerStatus.labelOf(user.getRunnerStatus()),
                user.getCreditScore(),
                user.getBalance(),
                user.getStatus(),
                user.getCreatedAt()
        );
    }
}
