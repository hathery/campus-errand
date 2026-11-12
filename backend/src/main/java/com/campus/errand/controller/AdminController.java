package com.campus.errand.controller;

import com.campus.errand.common.PageResult;
import com.campus.errand.common.Result;
import com.campus.errand.dto.AuditRunnerRequest;
import com.campus.errand.dto.CancelOrderRequest;
import com.campus.errand.security.LoginUser;
import com.campus.errand.service.impl.AdminService;
import com.campus.errand.vo.AdminUserVO;
import com.campus.errand.vo.DashboardVO;
import com.campus.errand.vo.OrderVO;
import com.campus.errand.vo.RunnerApplyVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "管理端")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @Operation(summary = "数据看板")
    @GetMapping("/dashboard")
    public Result<DashboardVO> dashboard() {
        return Result.ok(adminService.dashboard());
    }

    @Operation(summary = "用户列表")
    @GetMapping("/users")
    public Result<PageResult<AdminUserVO>> users(@RequestParam(required = false) String keyword,
                                                 @RequestParam(required = false) Integer status,
                                                 @RequestParam(defaultValue = "1") long page,
                                                 @RequestParam(defaultValue = "10") long size) {
        return Result.ok(adminService.users(keyword, status, page, size));
    }

    @Operation(summary = "启用/禁用用户")
    @PutMapping("/users/{id}/status")
    public Result<Void> updateUserStatus(@AuthenticationPrincipal LoginUser loginUser,
                                         @PathVariable Long id,
                                         @RequestParam Integer status) {
        adminService.updateUserStatus(loginUser.id(), id, status);
        return Result.ok();
    }

    @Operation(summary = "跑腿员认证申请列表")
    @GetMapping("/runner-applies")
    public Result<PageResult<RunnerApplyVO>> runnerApplies(@RequestParam(required = false) String status,
                                                           @RequestParam(defaultValue = "1") long page,
                                                           @RequestParam(defaultValue = "10") long size) {
        return Result.ok(adminService.runnerApplies(status, page, size));
    }

    @Operation(summary = "审核跑腿员认证")
    @PutMapping("/runner-applies/{id}/audit")
    public Result<Void> auditRunner(@AuthenticationPrincipal LoginUser loginUser,
                                    @PathVariable Long id,
                                    @Valid @RequestBody AuditRunnerRequest request) {
        adminService.auditRunner(loginUser.id(), id, request);
        return Result.ok();
    }

    @Operation(summary = "全量订单列表")
    @GetMapping("/orders")
    public Result<PageResult<OrderVO>> orders(@RequestParam(required = false) String status,
                                              @RequestParam(required = false) String keyword,
                                              @RequestParam(defaultValue = "1") long page,
                                              @RequestParam(defaultValue = "10") long size) {
        return Result.ok(adminService.orders(status, keyword, page, size));
    }

    @Operation(summary = "管理员取消订单并退款")
    @PostMapping("/orders/{id}/cancel")
    public Result<OrderVO> cancelOrder(@AuthenticationPrincipal LoginUser loginUser,
                                       @PathVariable Long id,
                                       @RequestBody(required = false) CancelOrderRequest request) {
        String reason = request == null ? null : request.reason();
        return Result.ok(adminService.forceCancel(loginUser.id(), id, reason));
    }
}
