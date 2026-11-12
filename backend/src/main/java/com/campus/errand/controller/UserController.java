package com.campus.errand.controller;

import com.campus.errand.common.PageResult;
import com.campus.errand.common.Result;
import com.campus.errand.dto.ChangePasswordRequest;
import com.campus.errand.dto.RechargeRequest;
import com.campus.errand.dto.RunnerApplyRequest;
import com.campus.errand.dto.UpdateProfileRequest;
import com.campus.errand.security.LoginUser;
import com.campus.errand.service.impl.UserService;
import com.campus.errand.vo.RunnerApplyVO;
import com.campus.errand.vo.RunnerStatsVO;
import com.campus.errand.vo.UserVO;
import com.campus.errand.vo.WalletTxnVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "用户中心")
@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "获取个人信息")
    @GetMapping("/profile")
    public Result<UserVO> profile(@AuthenticationPrincipal LoginUser loginUser) {
        return Result.ok(userService.profile(loginUser.id()));
    }

    @Operation(summary = "修改个人资料")
    @PutMapping("/profile")
    public Result<UserVO> updateProfile(@AuthenticationPrincipal LoginUser loginUser,
                                        @Valid @RequestBody UpdateProfileRequest request) {
        return Result.ok(userService.updateProfile(loginUser.id(), request));
    }

    @Operation(summary = "修改密码")
    @PutMapping("/password")
    public Result<Void> changePassword(@AuthenticationPrincipal LoginUser loginUser,
                                       @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(loginUser.id(), request);
        return Result.ok();
    }

    @Operation(summary = "模拟充值")
    @PostMapping("/recharge")
    public Result<UserVO> recharge(@AuthenticationPrincipal LoginUser loginUser,
                                   @Valid @RequestBody RechargeRequest request) {
        return Result.ok(userService.recharge(loginUser.id(), request));
    }

    @Operation(summary = "钱包流水")
    @GetMapping("/wallet/transactions")
    public Result<PageResult<WalletTxnVO>> transactions(@AuthenticationPrincipal LoginUser loginUser,
                                                        @RequestParam(defaultValue = "1") long page,
                                                        @RequestParam(defaultValue = "10") long size) {
        return Result.ok(userService.walletTransactions(loginUser.id(), page, size));
    }

    @Operation(summary = "提交跑腿员认证")
    @PostMapping("/runner/apply")
    public Result<RunnerApplyVO> applyRunner(@AuthenticationPrincipal LoginUser loginUser,
                                             @Valid @RequestBody RunnerApplyRequest request) {
        return Result.ok(userService.applyRunner(loginUser.id(), request));
    }

    @Operation(summary = "查看我的跑腿员认证")
    @GetMapping("/runner/apply")
    public Result<RunnerApplyVO> myRunnerApply(@AuthenticationPrincipal LoginUser loginUser) {
        return Result.ok(userService.myRunnerApply(loginUser.id()));
    }

    @Operation(summary = "跑腿员数据统计")
    @GetMapping("/runner/stats")
    public Result<RunnerStatsVO> runnerStats(@AuthenticationPrincipal LoginUser loginUser) {
        return Result.ok(userService.runnerStats(loginUser.id()));
    }
}
