package com.campus.errand.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.errand.common.BusinessException;
import com.campus.errand.common.PageResult;
import com.campus.errand.dto.PublishOrderRequest;
import com.campus.errand.dto.ReviewRequest;
import com.campus.errand.entity.ErrandOrder;
import com.campus.errand.entity.OrderLog;
import com.campus.errand.entity.Review;
import com.campus.errand.entity.User;
import com.campus.errand.entity.WalletTxn;
import com.campus.errand.enums.NotificationType;
import com.campus.errand.enums.OrderStatus;
import com.campus.errand.enums.OrderType;
import com.campus.errand.enums.PayStatus;
import com.campus.errand.enums.RunnerStatus;
import com.campus.errand.enums.WalletType;
import com.campus.errand.mapper.ErrandOrderMapper;
import com.campus.errand.mapper.OrderLogMapper;
import com.campus.errand.mapper.ReviewMapper;
import com.campus.errand.mapper.UserMapper;
import com.campus.errand.mapper.WalletTxnMapper;
import com.campus.errand.vo.FeeQuoteVO;
import com.campus.errand.vo.OrderLogVO;
import com.campus.errand.vo.OrderVO;
import com.campus.errand.vo.PublicStatsVO;
import com.campus.errand.vo.ReviewVO;
import org.springframework.beans.BeanUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * 订单核心业务：发布、抢单、配送、完成、取消、评价与查询。
 * 所有资金与状态变更均在事务中完成，并通过条件更新保证并发安全。
 */
@Service
public class OrderService {

    private static final DateTimeFormatter ORDER_NO_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final ErrandOrderMapper orderMapper;
    private final OrderLogMapper orderLogMapper;
    private final ReviewMapper reviewMapper;
    private final UserMapper userMapper;
    private final WalletTxnMapper walletTxnMapper;
    private final NotificationService notificationService;
    private final FeeCalculator feeCalculator;

    public OrderService(ErrandOrderMapper orderMapper, OrderLogMapper orderLogMapper,
                        ReviewMapper reviewMapper, UserMapper userMapper,
                        WalletTxnMapper walletTxnMapper, NotificationService notificationService,
                        FeeCalculator feeCalculator) {
        this.orderMapper = orderMapper;
        this.orderLogMapper = orderLogMapper;
        this.reviewMapper = reviewMapper;
        this.userMapper = userMapper;
        this.walletTxnMapper = walletTxnMapper;
        this.notificationService = notificationService;
        this.feeCalculator = feeCalculator;
    }

    public FeeQuoteVO quote(String type, Integer urgent, BigDecimal weight) {
        return feeCalculator.quote(type, urgent, weight);
    }

    @Transactional
    public OrderVO publish(Long publisherId, PublishOrderRequest request) {
        OrderType orderType = OrderType.of(request.type());
        if (orderType == null) {
            throw new BusinessException("不支持的跑腿类型");
        }
        FeeQuoteVO fee = feeCalculator.quote(orderType.name(), request.urgent(), request.weight());
        BigDecimal total = fee.total();
        BigDecimal commission = feeCalculator.commission(total);
        BigDecimal runnerIncome = total.subtract(commission).setScale(2, RoundingMode.HALF_UP);

        User publisher = userMapper.selectByIdForUpdate(publisherId);
        if (publisher == null) {
            throw BusinessException.notFound("用户不存在");
        }
        if (publisher.getBalance().compareTo(total) < 0) {
            throw new BusinessException("钱包余额不足，请先充值后再发布订单");
        }
        LocalDateTime now = LocalDateTime.now();
        BigDecimal after = publisher.getBalance().subtract(total).setScale(2, RoundingMode.HALF_UP);
        int updated = userMapper.deductBalance(publisherId, total, now);
        if (updated != 1) {
            throw BusinessException.conflict("余额扣减失败，请刷新后重试");
        }

        ErrandOrder order = new ErrandOrder();
        order.setOrderNo(generateOrderNo());
        order.setPublisherId(publisherId);
        order.setType(orderType.name());
        order.setTitle(request.title().trim());
        order.setDescription(trimToNull(request.description()));
        order.setPickupAddress(request.pickupAddress().trim());
        order.setDeliveryAddress(request.deliveryAddress().trim());
        order.setContactName(request.contactName().trim());
        order.setContactPhone(request.contactPhone().trim());
        order.setAmount(total);
        order.setCommission(commission);
        order.setRunnerIncome(runnerIncome);
        order.setStatus(OrderStatus.PENDING);
        order.setPayStatus(PayStatus.PAID);
        order.setExpectedTime(request.expectedTime());
        order.setUrgent(Integer.valueOf(1).equals(request.urgent()) ? 1 : 0);
        order.setWeight(request.weight().setScale(2, RoundingMode.HALF_UP));
        order.setCreatedAt(now);
        order.setUpdatedAt(now);
        orderMapper.insert(order);

        addLog(order.getId(), publisherId, "CREATE", null, OrderStatus.PENDING, "发布订单并托管支付");
        addWalletTxn(publisherId, order.getId(), WalletType.PAY, total, after,
                "支付订单 " + order.getOrderNo());

        return detail(order.getId(), publisherId, false);
    }

    public PageResult<OrderVO> hall(Long viewerId, String type, String keyword, long page, long size) {
        Page<ErrandOrder> p = new Page<>(Math.max(page, 1), Math.min(Math.max(size, 1), 30));
        IPage<ErrandOrder> result = orderMapper.selectPage(p, Wrappers.<ErrandOrder>lambdaQuery()
                .eq(ErrandOrder::getStatus, OrderStatus.PENDING)
                .ne(ErrandOrder::getPublisherId, viewerId)
                .eq(StringUtils.hasText(type), ErrandOrder::getType, type)
                .and(StringUtils.hasText(keyword), wrapper -> wrapper
                        .like(ErrandOrder::getTitle, keyword)
                        .or().like(ErrandOrder::getPickupAddress, keyword)
                        .or().like(ErrandOrder::getDeliveryAddress, keyword))
                .orderByDesc(ErrandOrder::getUrgent)
                .orderByDesc(ErrandOrder::getCreatedAt));
        return pageOf(result, viewerId, false, isApprovedRunner(viewerId));
    }

    public PageResult<OrderVO> minePublished(Long userId, String status, long page, long size) {
        Page<ErrandOrder> p = new Page<>(Math.max(page, 1), Math.min(Math.max(size, 1), 30));
        IPage<ErrandOrder> result = orderMapper.selectPage(p, Wrappers.<ErrandOrder>lambdaQuery()
                .eq(ErrandOrder::getPublisherId, userId)
                .eq(StringUtils.hasText(status), ErrandOrder::getStatus, status)
                .orderByDesc(ErrandOrder::getCreatedAt));
        return pageOf(result, userId, false, isApprovedRunner(userId));
    }

    public PageResult<OrderVO> mineAccepted(Long userId, String status, long page, long size) {
        Page<ErrandOrder> p = new Page<>(Math.max(page, 1), Math.min(Math.max(size, 1), 30));
        IPage<ErrandOrder> result = orderMapper.selectPage(p, Wrappers.<ErrandOrder>lambdaQuery()
                .eq(ErrandOrder::getRunnerId, userId)
                .eq(StringUtils.hasText(status), ErrandOrder::getStatus, status)
                .orderByDesc(ErrandOrder::getCreatedAt));
        return pageOf(result, userId, false, true);
    }

    public OrderVO detail(Long orderId, Long viewerId, boolean admin) {
        ErrandOrder order = requireOrder(orderId);
        boolean participant = Objects.equals(order.getPublisherId(), viewerId)
                || Objects.equals(order.getRunnerId(), viewerId);
        // 待接单订单允许已登录同学查看详情（联系方式会脱敏），
        // 其他状态仅允许交易双方和管理员查看。
        if (!admin && !participant && !OrderStatus.PENDING.equals(order.getStatus())) {
            throw BusinessException.forbidden("无权查看该订单");
        }
        User viewer = userMapper.selectById(viewerId);
        boolean approvedRunner = viewer != null
                && Integer.valueOf(RunnerStatus.APPROVED).equals(viewer.getRunnerStatus());
        List<OrderLog> logs = orderLogMapper.selectList(Wrappers.<OrderLog>lambdaQuery()
                .eq(OrderLog::getOrderId, orderId)
                .orderByAsc(OrderLog::getCreatedAt)
                .orderByAsc(OrderLog::getId));
        Review review = reviewMapper.selectOne(Wrappers.<Review>lambdaQuery()
                .eq(Review::getOrderId, orderId)
                .last("LIMIT 1"));
        return buildVO(order, Map.of(), review, logs, viewerId, admin, approvedRunner);
    }

    @Transactional
    public OrderVO accept(Long orderId, Long runnerId) {
        User runner = userMapper.selectById(runnerId);
        if (runner == null) {
            throw BusinessException.notFound("用户不存在");
        }
        if (!Integer.valueOf(RunnerStatus.APPROVED).equals(runner.getRunnerStatus())) {
            throw BusinessException.forbidden("请先通过跑腿员认证后再接单");
        }
        ErrandOrder order = requireOrder(orderId);
        if (Objects.equals(order.getPublisherId(), runnerId)) {
            throw new BusinessException("不能接自己发布的订单");
        }
        if (!OrderStatus.PENDING.equals(order.getStatus())) {
            throw BusinessException.conflict("订单已被接走或状态已变化");
        }
        LocalDateTime now = LocalDateTime.now();
        int updated = orderMapper.acceptOrder(orderId, runnerId, now);
        if (updated != 1) {
            throw BusinessException.conflict("手慢了，订单已被其他跑腿员接走");
        }
        addLog(orderId, runnerId, "ACCEPT", OrderStatus.PENDING, OrderStatus.ACCEPTED,
                "跑腿员 " + runner.getNickname() + " 接单");
        notificationService.send(order.getPublisherId(), "订单已被接单",
                "你的订单「" + order.getTitle() + "」已由 " + runner.getNickname() + " 接单，请保持电话畅通。",
                NotificationType.ORDER);
        return detail(orderId, runnerId, false);
    }

    @Transactional
    public OrderVO pickup(Long orderId, Long runnerId) {
        ErrandOrder order = requireOrder(orderId);
        assertRunner(order, runnerId);
        if (!OrderStatus.ACCEPTED.equals(order.getStatus())) {
            throw BusinessException.conflict("当前状态不能确认取件");
        }
        LocalDateTime now = LocalDateTime.now();
        if (orderMapper.markPickedUp(orderId, runnerId, now) != 1) {
            throw BusinessException.conflict("订单状态已变化，请刷新后重试");
        }
        addLog(orderId, runnerId, "PICKUP", OrderStatus.ACCEPTED, OrderStatus.PICKED_UP, "跑腿员确认已取件");
        notificationService.send(order.getPublisherId(), "跑腿员已取件",
                "订单「" + order.getTitle() + "」已取件，正在配送中。", NotificationType.ORDER);
        return detail(orderId, runnerId, false);
    }

    @Transactional
    public OrderVO deliver(Long orderId, Long runnerId) {
        ErrandOrder order = requireOrder(orderId);
        assertRunner(order, runnerId);
        if (!OrderStatus.PICKED_UP.equals(order.getStatus())) {
            throw BusinessException.conflict("当前状态不能确认送达");
        }
        LocalDateTime now = LocalDateTime.now();
        if (orderMapper.markDelivered(orderId, runnerId, now) != 1) {
            throw BusinessException.conflict("订单状态已变化，请刷新后重试");
        }
        addLog(orderId, runnerId, "DELIVER", OrderStatus.PICKED_UP, OrderStatus.DELIVERED, "跑腿员确认已送达");
        notificationService.send(order.getPublisherId(), "订单已送达",
                "订单「" + order.getTitle() + "」已送达，请确认完成后跑腿员才能收到报酬。", NotificationType.ORDER);
        return detail(orderId, runnerId, false);
    }

    @Transactional
    public OrderVO complete(Long orderId, Long publisherId) {
        ErrandOrder order = requireOrder(orderId);
        if (!Objects.equals(order.getPublisherId(), publisherId)) {
            throw BusinessException.forbidden("只有发布者可以确认完成");
        }
        if (!OrderStatus.DELIVERED.equals(order.getStatus())) {
            throw BusinessException.conflict("订单尚未送达，不能确认完成");
        }
        LocalDateTime now = LocalDateTime.now();
        if (orderMapper.markCompleted(orderId, publisherId, now) != 1) {
            throw BusinessException.conflict("订单状态已变化，请刷新后重试");
        }

        User runner = userMapper.selectByIdForUpdate(order.getRunnerId());
        if (runner == null) {
            throw BusinessException.notFound("跑腿员不存在");
        }
        userMapper.increaseBalance(runner.getId(), order.getRunnerIncome(), now);
        BigDecimal after = runner.getBalance().add(order.getRunnerIncome());
        addWalletTxn(runner.getId(), orderId, WalletType.INCOME, order.getRunnerIncome(), after,
                "订单 " + order.getOrderNo() + " 跑腿收入");
        addLog(orderId, publisherId, "COMPLETE", OrderStatus.DELIVERED, OrderStatus.COMPLETED,
                "发布者确认完成，跑腿员收入 " + order.getRunnerIncome() + " 元");
        notificationService.send(runner.getId(), "订单已完成",
                "订单「" + order.getTitle() + "」已完成，收入 " + order.getRunnerIncome() + " 元已存入钱包。",
                NotificationType.ORDER);
        return detail(orderId, publisherId, false);
    }

    @Transactional
    public OrderVO cancel(Long orderId, Long publisherId, String reason) {
        ErrandOrder order = requireOrder(orderId);
        if (!Objects.equals(order.getPublisherId(), publisherId)) {
            throw BusinessException.forbidden("只有发布者可以取消订单");
        }
        if (OrderStatus.CANCELLED.equals(order.getStatus())) {
            throw BusinessException.conflict("订单已经取消");
        }
        if (!OrderStatus.PENDING.equals(order.getStatus())) {
            throw BusinessException.conflict("订单已被接单，无法直接取消，请联系管理员处理");
        }
        String actualReason = StringUtils.hasText(reason) ? reason.trim() : "发布者主动取消";
        LocalDateTime now = LocalDateTime.now();
        if (orderMapper.cancelPending(orderId, publisherId, actualReason, now) != 1) {
            throw BusinessException.conflict("订单状态已变化，取消失败");
        }
        refund(order, "取消订单退款 " + order.getOrderNo());
        addLog(orderId, publisherId, "CANCEL", OrderStatus.PENDING, OrderStatus.CANCELLED, actualReason);
        notificationService.send(publisherId, "订单已取消",
                "订单「" + order.getTitle() + "」已取消，支付金额 " + order.getAmount() + " 元已退回钱包。",
                NotificationType.ORDER);
        return detail(orderId, publisherId, false);
    }

    @Transactional
    public OrderVO adminCancel(Long orderId, Long adminId, String reason) {
        ErrandOrder order = requireOrder(orderId);
        if (!OrderStatus.PENDING.equals(order.getStatus()) && !OrderStatus.ACCEPTED.equals(order.getStatus())) {
            throw BusinessException.conflict("只有待接单或已接单状态可以取消");
        }
        String actualReason = StringUtils.hasText(reason) ? reason.trim() : "管理员取消";
        LocalDateTime now = LocalDateTime.now();
        if (orderMapper.adminCancel(orderId, actualReason, now) != 1) {
            throw BusinessException.conflict("订单状态已变化，取消失败");
        }
        refund(order, "管理员取消退款 " + order.getOrderNo());
        addLog(orderId, adminId, "ADMIN_CANCEL", order.getStatus(), OrderStatus.CANCELLED, actualReason);
        notificationService.send(order.getPublisherId(), "订单已被管理员取消",
                "订单「" + order.getTitle() + "」已取消，支付金额 " + order.getAmount() + " 元已退回钱包。原因："
                        + actualReason, NotificationType.SYSTEM);
        if (order.getRunnerId() != null) {
            notificationService.send(order.getRunnerId(), "订单已被管理员取消",
                    "订单「" + order.getTitle() + "」已被管理员取消，请停止配送。", NotificationType.SYSTEM);
        }
        return detail(orderId, adminId, true);
    }

    @Transactional
    public ReviewVO review(Long orderId, Long publisherId, ReviewRequest request) {
        ErrandOrder order = requireOrder(orderId);
        if (!Objects.equals(order.getPublisherId(), publisherId)) {
            throw BusinessException.forbidden("只有发布者可以评价");
        }
        if (!OrderStatus.COMPLETED.equals(order.getStatus())) {
            throw BusinessException.conflict("订单完成后才能评价");
        }
        Long exists = reviewMapper.selectCount(Wrappers.<Review>lambdaQuery()
                .eq(Review::getOrderId, orderId));
        if (exists != null && exists > 0) {
            throw BusinessException.conflict("该订单已经评价过了");
        }
        Review review = new Review();
        review.setOrderId(orderId);
        review.setReviewerId(publisherId);
        review.setRevieweeId(order.getRunnerId());
        review.setRating(request.rating());
        review.setContent(trimToNull(request.content()));
        review.setAnonymous(Integer.valueOf(1).equals(request.anonymous()) ? 1 : 0);
        review.setCreatedAt(LocalDateTime.now());
        reviewMapper.insert(review);

        int delta = request.rating() >= 4 ? 1 : (request.rating() <= 2 ? -2 : 0);
        if (delta != 0) {
            userMapper.adjustCredit(order.getRunnerId(), delta, LocalDateTime.now());
        }
        addLog(orderId, publisherId, "REVIEW", OrderStatus.COMPLETED, OrderStatus.COMPLETED,
                "发布者给出 " + request.rating() + " 星评价");
        notificationService.send(order.getRunnerId(), "收到新评价",
                "订单「" + order.getTitle() + "」收到 " + request.rating() + " 星评价。", NotificationType.ORDER);

        String reviewerName = Integer.valueOf(1).equals(review.getAnonymous()) ? "匿名同学"
                : userMapper.selectById(publisherId).getNickname();
        return new ReviewVO(review.getId(), review.getRating(), review.getContent(), review.getAnonymous(),
                reviewerName, review.getCreatedAt());
    }

    public PageResult<OrderVO> pageForAdmin(String status, String keyword, long page, long size) {
        Page<ErrandOrder> p = new Page<>(Math.max(page, 1), Math.min(Math.max(size, 1), 50));
        IPage<ErrandOrder> result = orderMapper.selectPage(p, Wrappers.<ErrandOrder>lambdaQuery()
                .eq(StringUtils.hasText(status), ErrandOrder::getStatus, status)
                .and(StringUtils.hasText(keyword), wrapper -> wrapper
                        .like(ErrandOrder::getOrderNo, keyword)
                        .or().like(ErrandOrder::getTitle, keyword)
                        .or().like(ErrandOrder::getContactPhone, keyword))
                .orderByDesc(ErrandOrder::getCreatedAt));
        return pageOf(result, 0L, true, false);
    }

    public List<OrderVO> latestForAdmin(int limit) {
        List<ErrandOrder> orders = orderMapper.selectList(Wrappers.<ErrandOrder>lambdaQuery()
                .orderByDesc(ErrandOrder::getCreatedAt)
                .last("LIMIT " + Math.min(Math.max(limit, 1), 20)));
        return toVOList(orders, 0L, true, false, false);
    }

    public PublicStatsVO publicStats() {
        long users = userMapper.selectCount(null);
        long orders = orderMapper.selectCount(null);
        long completed = orderMapper.selectCount(Wrappers.<ErrandOrder>lambdaQuery()
                .eq(ErrandOrder::getStatus, OrderStatus.COMPLETED));
        double rate = orders == 0 ? 0.0 : Math.round(completed * 1000.0 / orders) / 10.0;
        return new PublicStatsVO(users, orders, completed, rate);
    }

    public ErrandOrder requireOrder(Long orderId) {
        ErrandOrder order = orderMapper.selectById(orderId);
        if (order == null) {
            throw BusinessException.notFound("订单不存在");
        }
        return order;
    }

    private void assertRunner(ErrandOrder order, Long runnerId) {
        if (!Objects.equals(order.getRunnerId(), runnerId)) {
            throw BusinessException.forbidden("只有接单跑腿员可以操作该订单");
        }
    }

    private void refund(ErrandOrder order, String remark) {
        User publisher = userMapper.selectByIdForUpdate(order.getPublisherId());
        if (publisher == null) {
            throw BusinessException.notFound("发布者不存在");
        }
        LocalDateTime now = LocalDateTime.now();
        userMapper.increaseBalance(publisher.getId(), order.getAmount(), now);
        BigDecimal after = publisher.getBalance().add(order.getAmount());
        addWalletTxn(publisher.getId(), order.getId(), WalletType.REFUND, order.getAmount(), after, remark);
    }

    private void addWalletTxn(Long userId, Long orderId, String type, BigDecimal amount,
                              BigDecimal balanceAfter, String remark) {
        WalletTxn txn = new WalletTxn();
        txn.setUserId(userId);
        txn.setOrderId(orderId);
        txn.setType(type);
        txn.setAmount(amount);
        txn.setBalanceAfter(balanceAfter);
        txn.setRemark(remark);
        txn.setCreatedAt(LocalDateTime.now());
        walletTxnMapper.insert(txn);
    }

    private void addLog(Long orderId, Long operatorId, String action, String fromStatus,
                        String toStatus, String remark) {
        OrderLog log = new OrderLog();
        log.setOrderId(orderId);
        log.setOperatorId(operatorId);
        log.setAction(action);
        log.setFromStatus(fromStatus);
        log.setToStatus(toStatus);
        log.setRemark(remark);
        log.setCreatedAt(LocalDateTime.now());
        orderLogMapper.insert(log);
    }

    private boolean isApprovedRunner(Long userId) {
        User user = userMapper.selectById(userId);
        return user != null && Integer.valueOf(RunnerStatus.APPROVED).equals(user.getRunnerStatus());
    }

    private PageResult<OrderVO> pageOf(IPage<ErrandOrder> page, Long viewerId,
                                       boolean admin, boolean approvedRunner) {
        List<OrderVO> records = toVOList(page.getRecords(), viewerId, admin, approvedRunner, false);
        return PageResult.of(records, page.getTotal(), page.getCurrent(), page.getSize());
    }

    private List<OrderVO> toVOList(List<ErrandOrder> orders, Long viewerId,
                                   boolean admin, boolean approvedRunner, boolean includeDetails) {
        if (orders.isEmpty()) {
            return List.of();
        }
        Set<Long> userIds = new HashSet<>();
        Set<Long> orderIds = new HashSet<>();
        for (ErrandOrder order : orders) {
            userIds.add(order.getPublisherId());
            if (order.getRunnerId() != null) {
                userIds.add(order.getRunnerId());
            }
            orderIds.add(order.getId());
        }
        Map<Long, User> users = userMapper.selectByIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user));
        Map<Long, Review> reviews = reviewMapper.selectList(Wrappers.<Review>lambdaQuery()
                        .in(Review::getOrderId, orderIds))
                .stream()
                .collect(Collectors.toMap(Review::getOrderId, review -> review, (a, b) -> a));

        List<OrderVO> result = new ArrayList<>();
        for (ErrandOrder order : orders) {
            List<OrderLog> logs = List.of();
            if (includeDetails) {
                logs = orderLogMapper.selectList(Wrappers.<OrderLog>lambdaQuery()
                        .eq(OrderLog::getOrderId, order.getId())
                        .orderByAsc(OrderLog::getCreatedAt));
            }
            result.add(buildVO(order, users, reviews.get(order.getId()), logs,
                    viewerId, admin, approvedRunner));
        }
        return result;
    }

    private OrderVO buildVO(ErrandOrder order, Map<Long, User> users, Review review,
                            List<OrderLog> logs, Long viewerId, boolean admin,
                            boolean approvedRunner) {
        OrderVO vo = new OrderVO();
        BeanUtils.copyProperties(order, vo);
        vo.setTypeLabel(OrderType.labelOf(order.getType()));
        vo.setStatusLabel(OrderStatus.labelOf(order.getStatus()));
        vo.setPayStatusLabel(PayStatus.labelOf(order.getPayStatus()));

        User publisher = users.get(order.getPublisherId());
        if (publisher == null) {
            publisher = userMapper.selectById(order.getPublisherId());
        }
        if (publisher != null) {
            vo.setPublisherName(publisher.getNickname());
            vo.setPublisherAvatar(publisher.getAvatar());
        }
        User runner = order.getRunnerId() == null ? null : users.get(order.getRunnerId());
        if (runner == null && order.getRunnerId() != null) {
            runner = userMapper.selectById(order.getRunnerId());
        }
        if (runner != null) {
            vo.setRunnerName(runner.getNickname());
            vo.setRunnerAvatar(runner.getAvatar());
        }

        boolean isPublisher = Objects.equals(viewerId, order.getPublisherId());
        boolean isRunner = Objects.equals(viewerId, order.getRunnerId());
        if (!admin && !isPublisher && !isRunner) {
            vo.setContactPhone(maskPhone(order.getContactPhone()));
        }
        vo.setCanAccept(!admin && approvedRunner && !isPublisher
                && OrderStatus.PENDING.equals(order.getStatus()));
        vo.setCanCancel(!admin && isPublisher && OrderStatus.PENDING.equals(order.getStatus()));
        vo.setCanPickup(!admin && isRunner && OrderStatus.ACCEPTED.equals(order.getStatus()));
        vo.setCanDeliver(!admin && isRunner && OrderStatus.PICKED_UP.equals(order.getStatus()));
        vo.setCanComplete(!admin && isPublisher && OrderStatus.DELIVERED.equals(order.getStatus()));
        vo.setReviewed(review != null);
        vo.setCanReview(!admin && isPublisher && OrderStatus.COMPLETED.equals(order.getStatus()) && review == null);

        if (review != null) {
            String reviewerName = Integer.valueOf(1).equals(review.getAnonymous()) ? "匿名同学"
                    : (publisher == null ? "同学" : publisher.getNickname());
            vo.setReview(new ReviewVO(review.getId(), review.getRating(), review.getContent(),
                    review.getAnonymous(), reviewerName, review.getCreatedAt()));
        }
        if (logs != null && !logs.isEmpty()) {
            vo.setLogs(logs.stream().map(OrderLogVO::from).toList());
        }
        return vo;
    }

    private String generateOrderNo() {
        return "CE" + LocalDateTime.now().format(ORDER_NO_FORMAT)
                + String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) {
            return "接单后可见";
        }
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }
}
