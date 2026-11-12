package com.campus.errand.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.errand.common.BusinessException;
import com.campus.errand.common.PageResult;
import com.campus.errand.dto.AuditRunnerRequest;
import com.campus.errand.entity.ErrandOrder;
import com.campus.errand.entity.RunnerApply;
import com.campus.errand.entity.User;
import com.campus.errand.enums.NotificationType;
import com.campus.errand.enums.OrderStatus;
import com.campus.errand.enums.OrderType;
import com.campus.errand.enums.Role;
import com.campus.errand.enums.RunnerStatus;
import com.campus.errand.mapper.ErrandOrderMapper;
import com.campus.errand.mapper.RunnerApplyMapper;
import com.campus.errand.mapper.UserMapper;
import com.campus.errand.vo.AdminUserVO;
import com.campus.errand.vo.DashboardVO;
import com.campus.errand.vo.OrderVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 管理端：数据看板、用户管理、跑腿员审核与订单监管。
 */
@Service
public class AdminService {

    private final UserMapper userMapper;
    private final RunnerApplyMapper runnerApplyMapper;
    private final ErrandOrderMapper orderMapper;
    private final OrderService orderService;
    private final NotificationService notificationService;

    public AdminService(UserMapper userMapper, RunnerApplyMapper runnerApplyMapper,
                        ErrandOrderMapper orderMapper, OrderService orderService,
                        NotificationService notificationService) {
        this.userMapper = userMapper;
        this.runnerApplyMapper = runnerApplyMapper;
        this.orderMapper = orderMapper;
        this.orderService = orderService;
        this.notificationService = notificationService;
    }

    public DashboardVO dashboard() {
        long userCount = count(userMapper.selectCount(null));
        long runnerCount = count(userMapper.selectCount(Wrappers.<User>lambdaQuery()
                .eq(User::getRunnerStatus, RunnerStatus.APPROVED)));
        long orderCount = count(orderMapper.selectCount(null));
        long todayOrderCount = count(orderMapper.selectCount(Wrappers.<ErrandOrder>lambdaQuery()
                .ge(ErrandOrder::getCreatedAt, LocalDate.now().atStartOfDay())));
        long completedOrderCount = count(orderMapper.selectCount(Wrappers.<ErrandOrder>lambdaQuery()
                .eq(ErrandOrder::getStatus, OrderStatus.COMPLETED)));
        long pendingApplyCount = count(runnerApplyMapper.selectCount(Wrappers.<RunnerApply>lambdaQuery()
                .eq(RunnerApply::getStatus, "PENDING")));

        BigDecimal turnover = orderMapper.selectList(Wrappers.<ErrandOrder>lambdaQuery()
                        .eq(ErrandOrder::getStatus, OrderStatus.COMPLETED))
                .stream()
                .map(ErrandOrder::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, java.math.RoundingMode.HALF_UP);

        LocalDate today = LocalDate.now();
        LocalDateTime weekStart = today.minusDays(6).atStartOfDay();
        Map<LocalDate, Long> dayCounts = orderMapper.selectList(Wrappers.<ErrandOrder>lambdaQuery()
                        .ge(ErrandOrder::getCreatedAt, weekStart))
                .stream()
                .collect(Collectors.groupingBy(
                        order -> order.getCreatedAt().toLocalDate(),
                        Collectors.counting()));
        List<DashboardVO.TrendPoint> trend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            trend.add(new DashboardVO.TrendPoint(date.toString(), dayCounts.getOrDefault(date, 0L)));
        }

        Map<String, Long> typeCounts = orderMapper.selectList(null).stream()
                .collect(Collectors.groupingBy(ErrandOrder::getType, Collectors.counting()));
        List<DashboardVO.TypePoint> types = Arrays.stream(OrderType.values())
                .map(type -> new DashboardVO.TypePoint(type.name(), type.getLabel(),
                        typeCounts.getOrDefault(type.name(), 0L)))
                .toList();

        List<OrderVO> latestOrders = orderService.latestForAdmin(6);
        return new DashboardVO(userCount, runnerCount, orderCount, todayOrderCount,
                completedOrderCount, turnover, pendingApplyCount, trend, types, latestOrders);
    }

    public PageResult<AdminUserVO> users(String keyword, Integer status, long page, long size) {
        Page<User> p = new Page<>(Math.max(page, 1), Math.min(Math.max(size, 1), 50));
        IPage<User> result = userMapper.selectPage(p, Wrappers.<User>lambdaQuery()
                .eq(status != null, User::getStatus, status)
                .and(StringUtils.hasText(keyword), wrapper -> wrapper
                        .like(User::getUsername, keyword)
                        .or().like(User::getNickname, keyword)
                        .or().like(User::getPhone, keyword))
                .orderByDesc(User::getCreatedAt));
        List<AdminUserVO> records = result.getRecords().stream()
                .map(this::toAdminUserVO)
                .toList();
        return PageResult.of(records, result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Transactional
    public void updateUserStatus(Long adminId, Long userId, Integer status) {
        if (status == null || (status != 0 && status != 1)) {
            throw new BusinessException("用户状态不合法");
        }
        if (adminId.equals(userId)) {
            throw new BusinessException("不能禁用当前登录的管理员账号");
        }
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw BusinessException.notFound("用户不存在");
        }
        if (Role.ADMIN.equals(user.getRole())) {
            throw new BusinessException("不能修改其他管理员的状态");
        }
        User update = new User();
        update.setId(userId);
        update.setStatus(status);
        update.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(update);
        notificationService.send(userId, status == 1 ? "账号已恢复" : "账号已被禁用",
                status == 1 ? "你的账号已恢复正常使用。" : "你的账号因异常行为被管理员禁用，如有疑问请联系管理员。",
                NotificationType.SYSTEM);
    }

    public PageResult<com.campus.errand.vo.RunnerApplyVO> runnerApplies(String status, long page, long size) {
        Page<RunnerApply> p = new Page<>(Math.max(page, 1), Math.min(Math.max(size, 1), 50));
        IPage<RunnerApply> result = runnerApplyMapper.selectPage(p, Wrappers.<RunnerApply>lambdaQuery()
                .eq(StringUtils.hasText(status), RunnerApply::getStatus, status)
                .orderByDesc(RunnerApply::getCreatedAt));
        List<com.campus.errand.vo.RunnerApplyVO> records = result.getRecords().stream()
                .map(this::toApplyVO)
                .toList();
        return PageResult.of(records, result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Transactional
    public void auditRunner(Long adminId, Long applyId, AuditRunnerRequest request) {
        String status = request.status();
        if (!"APPROVED".equals(status) && !"REJECTED".equals(status)) {
            throw new BusinessException("审核结果只能为 APPROVED 或 REJECTED");
        }
        RunnerApply apply = runnerApplyMapper.selectById(applyId);
        if (apply == null) {
            throw BusinessException.notFound("认证申请不存在");
        }
        if (!"PENDING".equals(apply.getStatus())) {
            throw BusinessException.conflict("该申请已审核，请勿重复操作");
        }
        LocalDateTime now = LocalDateTime.now();
        apply.setStatus(status);
        apply.setAuditRemark(request.remark());
        apply.setAuditedAt(now);
        runnerApplyMapper.updateById(apply);

        User user = userMapper.selectById(apply.getUserId());
        if (user == null) {
            throw BusinessException.notFound("申请用户不存在");
        }
        user.setRunnerStatus("APPROVED".equals(status) ? RunnerStatus.APPROVED : RunnerStatus.REJECTED);
        user.setUpdatedAt(now);
        userMapper.updateById(user);

        String title = "APPROVED".equals(status) ? "跑腿员认证通过" : "跑腿员认证未通过";
        String content = "APPROVED".equals(status)
                ? "恭喜你成为认证跑腿员，现在可以前往订单大厅接单了。"
                : "你的跑腿员认证申请未通过。原因：" + (StringUtils.hasText(request.remark())
                ? request.remark() : "资料不完整，请修改后重新提交");
        notificationService.send(user.getId(), title, content, NotificationType.RUNNER);
    }

    public PageResult<OrderVO> orders(String status, String keyword, long page, long size) {
        return orderService.pageForAdmin(status, keyword, page, size);
    }

    public OrderVO forceCancel(Long adminId, Long orderId, String reason) {
        return orderService.adminCancel(orderId, adminId, reason);
    }

    private AdminUserVO toAdminUserVO(User user) {
        return new AdminUserVO(user.getId(), user.getUsername(), user.getNickname(), user.getPhone(),
                user.getAvatar(), user.getRole(), user.getRunnerStatus(),
                RunnerStatus.labelOf(user.getRunnerStatus()), user.getCreditScore(), user.getBalance(),
                user.getStatus(), user.getCreatedAt());
    }

    private com.campus.errand.vo.RunnerApplyVO toApplyVO(RunnerApply apply) {
        User user = userMapper.selectById(apply.getUserId());
        return new com.campus.errand.vo.RunnerApplyVO(
                apply.getId(), apply.getUserId(),
                user == null ? null : user.getUsername(),
                user == null ? null : user.getNickname(),
                user == null ? null : user.getAvatar(),
                apply.getRealName(), apply.getStudentNo(), apply.getPhone(), apply.getReason(),
                apply.getStatus(),
                switch (apply.getStatus()) {
                    case "PENDING" -> "审核中";
                    case "APPROVED" -> "已通过";
                    case "REJECTED" -> "已驳回";
                    default -> apply.getStatus();
                },
                apply.getAuditRemark(), apply.getCreatedAt(), apply.getAuditedAt());
    }

    private long count(Long value) {
        return value == null ? 0 : value;
    }
}
