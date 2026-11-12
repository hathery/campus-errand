package com.campus.errand.config;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.campus.errand.dto.PublishOrderRequest;
import com.campus.errand.dto.ReviewRequest;
import com.campus.errand.entity.ErrandOrder;
import com.campus.errand.entity.RunnerApply;
import com.campus.errand.entity.User;
import com.campus.errand.entity.WalletTxn;
import com.campus.errand.enums.NotificationType;
import com.campus.errand.enums.OrderType;
import com.campus.errand.enums.Role;
import com.campus.errand.enums.RunnerStatus;
import com.campus.errand.enums.WalletType;
import com.campus.errand.mapper.ErrandOrderMapper;
import com.campus.errand.mapper.RunnerApplyMapper;
import com.campus.errand.mapper.UserMapper;
import com.campus.errand.mapper.WalletTxnMapper;
import com.campus.errand.service.impl.NotificationService;
import com.campus.errand.service.impl.OrderService;
import com.campus.errand.vo.OrderVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 演示数据初始化。仅在数据库为空且 app.demo-data=true 时执行一次。
 * 生产环境请设置 APP_DEMO_DATA=false，并通过后台创建真实账号。
 */
@Component
@ConditionalOnProperty(name = "app.demo-data", havingValue = "true", matchIfMissing = true)
public class DemoDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private final UserMapper userMapper;
    private final RunnerApplyMapper runnerApplyMapper;
    private final WalletTxnMapper walletTxnMapper;
    private final ErrandOrderMapper orderMapper;
    private final OrderService orderService;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    public DemoDataInitializer(UserMapper userMapper, RunnerApplyMapper runnerApplyMapper,
                               WalletTxnMapper walletTxnMapper, ErrandOrderMapper orderMapper,
                               OrderService orderService, NotificationService notificationService,
                               PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.runnerApplyMapper = runnerApplyMapper;
        this.walletTxnMapper = walletTxnMapper;
        this.orderMapper = orderMapper;
        this.orderService = orderService;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Long count = userMapper.selectCount(null);
        if (count != null && count > 0) {
            log.info("数据库已有用户，跳过演示数据初始化");
            return;
        }
        log.info("开始初始化校园跑腿系统演示数据...");

        User admin = createUser("admin", "admin123", "系统管理员", "13800000001", Role.ADMIN,
                RunnerStatus.NONE, new BigDecimal("0.00"));
        User student1 = createUser("student1", "123456", "陈同学", "13800000002", Role.USER,
                RunnerStatus.NONE, new BigDecimal("200.00"));
        User student2 = createUser("student2", "123456", "林同学", "13800000003", Role.USER,
                RunnerStatus.NONE, new BigDecimal("150.00"));
        User runner1 = createUser("runner1", "123456", "阿凯", "13800000004", Role.USER,
                RunnerStatus.APPROVED, new BigDecimal("100.00"));
        User runner2 = createUser("runner2", "123456", "小周", "13800000005", Role.USER,
                RunnerStatus.PENDING, new BigDecimal("50.00"));

        seedWallet(student1, "演示账户初始余额");
        seedWallet(student2, "演示账户初始余额");
        seedWallet(runner1, "演示账户初始余额");
        seedWallet(runner2, "演示账户初始余额");

        createApply(runner1, "张凯", "2022010101", "本人熟悉校园路线，课余时间充足，希望利用空闲时间帮助同学。",
                "APPROVED", "资料齐全，同意认证", LocalDateTime.now().minusDays(8));
        createApply(runner2, "周明", "2022010102", "想利用课余时间锻炼自己，熟悉取快递和食堂路线。",
                "PENDING", null, LocalDateTime.now().minusHours(3));

        LocalDateTime now = LocalDateTime.now();
        List<Long> orderIds = new ArrayList<>();

        OrderVO pending = orderService.publish(student2.getId(), new PublishOrderRequest(
                OrderType.EXPRESS.name(), "帮取一个中通快递", "快递在菜鸟驿站 3 号货架，取件码已放备注，麻烦送到 6 号宿舍楼。",
                "菜鸟驿站（东门）", "6 号宿舍楼 302", "林同学", "13800000003",
                now.plusHours(3), 0, new BigDecimal("1.5")));
        orderIds.add(pending.getId());

        OrderVO accepted = orderService.publish(student1.getId(), new PublishOrderRequest(
                OrderType.FOOD.name(), "帮带一份一食堂黄焖鸡", "微辣，不要香菜，打包带走。",
                "一食堂二楼黄焖鸡窗口", "图书馆南门", "陈同学", "13800000002",
                now.plusHours(2), 1, new BigDecimal("1.0")));
        orderService.accept(accepted.getId(), runner1.getId());
        orderIds.add(accepted.getId());

        OrderVO picked = orderService.publish(student2.getId(), new PublishOrderRequest(
                OrderType.PRINT.name(), "打印实验报告并送到实验楼", "PDF 已发到跑腿员聊天窗口，双面黑白，共 12 页。",
                "图书馆一楼打印店", "信息楼 A305", "林同学", "13800000003",
                now.plusHours(4), 0, new BigDecimal("0.5")));
        orderService.accept(picked.getId(), runner1.getId());
        orderService.pickup(picked.getId(), runner1.getId());
        orderIds.add(picked.getId());

        OrderVO delivered = orderService.publish(student1.getId(), new PublishOrderRequest(
                OrderType.PURCHASE.name(), "代购充电宝和数据线", "Type-C 数据线 1 米，充电宝 10000mAh，超市没有就去北门数码店。",
                "北门数码店", "3 号教学楼 201", "陈同学", "13800000002",
                now.plusHours(6), 1, new BigDecimal("2.0")));
        orderService.accept(delivered.getId(), runner1.getId());
        orderService.pickup(delivered.getId(), runner1.getId());
        orderService.deliver(delivered.getId(), runner1.getId());
        orderIds.add(delivered.getId());

        OrderVO completed = orderService.publish(student2.getId(), new PublishOrderRequest(
                OrderType.OTHER.name(), "帮忙把社团物资搬到活动中心", "两箱宣传册，从 9 号楼仓库搬到大学生活动中心 102。",
                "9 号楼仓库", "大学生活动中心 102", "林同学", "13800000003",
                now.plusHours(8), 0, new BigDecimal("8.0")));
        orderService.accept(completed.getId(), runner1.getId());
        orderService.pickup(completed.getId(), runner1.getId());
        orderService.deliver(completed.getId(), runner1.getId());
        orderService.complete(completed.getId(), student2.getId());
        orderService.review(completed.getId(), student2.getId(),
                new ReviewRequest(5, "速度很快，物品完好，沟通也很顺畅，下次还找你！", 0));
        orderIds.add(completed.getId());

        OrderVO cancelled = orderService.publish(student1.getId(), new PublishOrderRequest(
                OrderType.EXPRESS.name(), "帮取顺丰快递", "临时有事，先取消订单。",
                "顺丰快递点", "5 号宿舍楼 101", "陈同学", "13800000002",
                now.plusHours(5), 0, new BigDecimal("2.0")));
        orderService.cancel(cancelled.getId(), student1.getId(), "行程有变，暂时不需要了");
        orderIds.add(cancelled.getId());

        // 将演示订单的创建时间分散到最近一周，便于管理端趋势图展示。
        for (int i = 0; i < orderIds.size(); i++) {
            LocalDateTime time = now.minusDays(i).withHour(10 + i).withMinute(20 + i).withSecond(0).withNano(0);
            orderMapper.update(null, Wrappers.<ErrandOrder>lambdaUpdate()
                    .eq(ErrandOrder::getId, orderIds.get(i))
                    .set(ErrandOrder::getCreatedAt, time));
        }

        notificationService.send(student1.getId(), "欢迎使用校园跑",
                "发布跑腿需求、认证跑腿员、接单赚取报酬，都可以在这里完成。", NotificationType.SYSTEM);
        notificationService.send(runner1.getId(), "认证已通过",
                "你已成为认证跑腿员，可以去订单大厅接单了。", NotificationType.RUNNER);

        log.info("演示数据初始化完成：admin/admin123，其他账号密码 123456");
    }

    private User createUser(String username, String password, String nickname, String phone,
                            String role, int runnerStatus, BigDecimal balance) {
        LocalDateTime now = LocalDateTime.now();
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setNickname(nickname);
        user.setPhone(phone);
        user.setRole(role);
        user.setRunnerStatus(runnerStatus);
        user.setCreditScore(100);
        user.setBalance(balance);
        user.setStatus(1);
        user.setCreatedAt(now.minusDays(20));
        user.setUpdatedAt(now);
        userMapper.insert(user);
        return user;
    }

    private void seedWallet(User user, String remark) {
        WalletTxn txn = new WalletTxn();
        txn.setUserId(user.getId());
        txn.setType(WalletType.RECHARGE);
        txn.setAmount(user.getBalance());
        txn.setBalanceAfter(user.getBalance());
        txn.setRemark(remark);
        txn.setCreatedAt(LocalDateTime.now().minusDays(15));
        walletTxnMapper.insert(txn);
    }

    private void createApply(User user, String realName, String studentNo, String reason,
                             String status, String auditRemark, LocalDateTime createdAt) {
        RunnerApply apply = new RunnerApply();
        apply.setUserId(user.getId());
        apply.setRealName(realName);
        apply.setStudentNo(studentNo);
        apply.setPhone(user.getPhone());
        apply.setReason(reason);
        apply.setStatus(status);
        apply.setAuditRemark(auditRemark);
        apply.setCreatedAt(createdAt);
        apply.setAuditedAt("PENDING".equals(status) ? null : createdAt.plusHours(6));
        runnerApplyMapper.insert(apply);
    }
}
