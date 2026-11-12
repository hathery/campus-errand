package com.campus.errand.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.errand.common.BusinessException;
import com.campus.errand.common.PageResult;
import com.campus.errand.dto.ChangePasswordRequest;
import com.campus.errand.dto.RechargeRequest;
import com.campus.errand.dto.RunnerApplyRequest;
import com.campus.errand.dto.UpdateProfileRequest;
import com.campus.errand.entity.Review;
import com.campus.errand.entity.RunnerApply;
import com.campus.errand.entity.User;
import com.campus.errand.entity.WalletTxn;
import com.campus.errand.entity.ErrandOrder;
import com.campus.errand.enums.NotificationType;
import com.campus.errand.enums.OrderStatus;
import com.campus.errand.enums.RunnerStatus;
import com.campus.errand.enums.WalletType;
import com.campus.errand.mapper.ErrandOrderMapper;
import com.campus.errand.mapper.ReviewMapper;
import com.campus.errand.mapper.RunnerApplyMapper;
import com.campus.errand.mapper.UserMapper;
import com.campus.errand.mapper.WalletTxnMapper;
import com.campus.errand.vo.RunnerApplyVO;
import com.campus.errand.vo.RunnerStatsVO;
import com.campus.errand.vo.UserVO;
import com.campus.errand.vo.WalletTxnVO;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 个人资料、钱包与跑腿员认证。
 */
@Service
public class UserService {

    private final UserMapper userMapper;
    private final WalletTxnMapper walletTxnMapper;
    private final RunnerApplyMapper runnerApplyMapper;
    private final ReviewMapper reviewMapper;
    private final ErrandOrderMapper orderMapper;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserMapper userMapper, WalletTxnMapper walletTxnMapper,
                       RunnerApplyMapper runnerApplyMapper, ReviewMapper reviewMapper,
                       ErrandOrderMapper orderMapper, NotificationService notificationService,
                       PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.walletTxnMapper = walletTxnMapper;
        this.runnerApplyMapper = runnerApplyMapper;
        this.reviewMapper = reviewMapper;
        this.orderMapper = orderMapper;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
    }

    public UserVO profile(Long userId) {
        User user = requireUser(userId);
        return UserVO.from(user);
    }

    public User requireUser(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw BusinessException.notFound("用户不存在");
        }
        return user;
    }

    @Transactional
    public UserVO updateProfile(Long userId, UpdateProfileRequest request) {
        User user = requireUser(userId);
        if (StringUtils.hasText(request.nickname())) {
            user.setNickname(request.nickname().trim());
        }
        if (StringUtils.hasText(request.phone()) && !request.phone().equals(user.getPhone())) {
            Long count = userMapper.selectCount(Wrappers.<User>lambdaQuery()
                    .eq(User::getPhone, request.phone())
                    .ne(User::getId, userId));
            if (count != null && count > 0) {
                throw BusinessException.conflict("该手机号已被其他账号使用");
            }
            user.setPhone(request.phone().trim());
        }
        if (request.email() != null) {
            user.setEmail(request.email().trim());
        }
        if (request.avatar() != null) {
            user.setAvatar(request.avatar().trim());
        }
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        return UserVO.from(user);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = requireUser(userId);
        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new BusinessException("原密码不正确");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new BusinessException("新密码不能与原密码相同");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
    }

    @Transactional
    public UserVO recharge(Long userId, RechargeRequest request) {
        BigDecimal amount = request.amount().setScale(2, RoundingMode.HALF_UP);
        User locked = userMapper.selectByIdForUpdate(userId);
        if (locked == null) {
            throw BusinessException.notFound("用户不存在");
        }
        LocalDateTime now = LocalDateTime.now();
        userMapper.increaseBalance(userId, amount, now);
        BigDecimal after = locked.getBalance().add(amount);

        WalletTxn txn = new WalletTxn();
        txn.setUserId(userId);
        txn.setType(WalletType.RECHARGE);
        txn.setAmount(amount);
        txn.setBalanceAfter(after);
        txn.setRemark("模拟充值");
        txn.setCreatedAt(now);
        walletTxnMapper.insert(txn);

        return UserVO.from(userMapper.selectById(userId));
    }

    public PageResult<WalletTxnVO> walletTransactions(Long userId, long page, long size) {
        Page<WalletTxn> p = new Page<>(Math.max(page, 1), Math.min(Math.max(size, 1), 50));
        IPage<WalletTxn> result = walletTxnMapper.selectPage(p, Wrappers.<WalletTxn>lambdaQuery()
                .eq(WalletTxn::getUserId, userId)
                .orderByDesc(WalletTxn::getCreatedAt)
                .orderByDesc(WalletTxn::getId));
        List<WalletTxnVO> records = result.getRecords().stream().map(WalletTxnVO::of).toList();
        return PageResult.of(records, result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Transactional
    public RunnerApplyVO applyRunner(Long userId, RunnerApplyRequest request) {
        User user = requireUser(userId);
        if (Integer.valueOf(RunnerStatus.APPROVED).equals(user.getRunnerStatus())) {
            throw BusinessException.conflict("你已经是认证跑腿员");
        }
        if (Integer.valueOf(RunnerStatus.PENDING).equals(user.getRunnerStatus())) {
            throw BusinessException.conflict("认证申请正在审核中，请耐心等待");
        }

        LocalDateTime now = LocalDateTime.now();
        RunnerApply apply = runnerApplyMapper.selectOne(Wrappers.<RunnerApply>lambdaQuery()
                .eq(RunnerApply::getUserId, userId)
                .last("LIMIT 1"));
        if (apply == null) {
            apply = new RunnerApply();
            apply.setUserId(userId);
            apply.setCreatedAt(now);
        }
        apply.setRealName(request.realName().trim());
        apply.setStudentNo(request.studentNo().trim());
        apply.setPhone(request.phone().trim());
        apply.setReason(request.reason());
        apply.setStatus("PENDING");
        apply.setAuditRemark(null);
        apply.setAuditedAt(null);
        if (apply.getId() == null) {
            runnerApplyMapper.insert(apply);
        } else {
            runnerApplyMapper.updateById(apply);
        }

        user.setRunnerStatus(RunnerStatus.PENDING);
        user.setUpdatedAt(now);
        userMapper.updateById(user);

        notificationService.send(userId, "认证申请已提交",
                "你的跑腿员认证申请已进入审核队列，审核结果将通过站内信通知。", NotificationType.RUNNER);
        return toApplyVO(apply);
    }

    public RunnerApplyVO myRunnerApply(Long userId) {
        RunnerApply apply = runnerApplyMapper.selectOne(Wrappers.<RunnerApply>lambdaQuery()
                .eq(RunnerApply::getUserId, userId)
                .last("LIMIT 1"));
        return apply == null ? null : toApplyVO(apply);
    }

    public RunnerStatsVO runnerStats(Long userId) {
        User user = requireUser(userId);
        long completed = countCompleted(userId);
        BigDecimal income = walletTxnMapper.selectList(Wrappers.<WalletTxn>lambdaQuery()
                        .eq(WalletTxn::getUserId, userId)
                        .eq(WalletTxn::getType, WalletType.INCOME))
                .stream()
                .map(WalletTxn::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<Review> reviews = reviewMapper.selectList(Wrappers.<Review>lambdaQuery()
                .eq(Review::getRevieweeId, userId));
        double avg = reviews.isEmpty() ? 5.0
                : reviews.stream().mapToInt(Review::getRating).average().orElse(5.0);
        return new RunnerStatsVO(completed, income, Math.round(avg * 10.0) / 10.0,
                user.getCreditScore() == null ? 100 : user.getCreditScore());
    }

    private long countCompleted(Long userId) {
        Long count = orderMapper.selectCount(Wrappers.<ErrandOrder>lambdaQuery()
                .eq(ErrandOrder::getRunnerId, userId)
                .eq(ErrandOrder::getStatus, OrderStatus.COMPLETED));
        return count == null ? 0 : count;
    }

    public RunnerApplyVO toApplyVO(RunnerApply apply) {
        User user = userMapper.selectById(apply.getUserId());
        return new RunnerApplyVO(
                apply.getId(),
                apply.getUserId(),
                user == null ? null : user.getUsername(),
                user == null ? null : user.getNickname(),
                user == null ? null : user.getAvatar(),
                apply.getRealName(),
                apply.getStudentNo(),
                apply.getPhone(),
                apply.getReason(),
                apply.getStatus(),
                statusLabel(apply.getStatus()),
                apply.getAuditRemark(),
                apply.getCreatedAt(),
                apply.getAuditedAt()
        );
    }

    private String statusLabel(String status) {
        return switch (status) {
            case "PENDING" -> "审核中";
            case "APPROVED" -> "已通过";
            case "REJECTED" -> "已驳回";
            default -> status;
        };
    }
}
