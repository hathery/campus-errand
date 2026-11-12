package com.campus.errand.controller;

import com.campus.errand.common.PageResult;
import com.campus.errand.common.Result;
import com.campus.errand.dto.CancelOrderRequest;
import com.campus.errand.dto.PublishOrderRequest;
import com.campus.errand.dto.ReviewRequest;
import com.campus.errand.security.LoginUser;
import com.campus.errand.service.impl.OrderService;
import com.campus.errand.vo.FeeQuoteVO;
import com.campus.errand.vo.OrderVO;
import com.campus.errand.vo.ReviewVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@Tag(name = "订单")
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @Operation(summary = "费用试算")
    @GetMapping("/quote")
    public Result<FeeQuoteVO> quote(@RequestParam String type,
                                    @RequestParam(defaultValue = "0") Integer urgent,
                                    @RequestParam(defaultValue = "1") BigDecimal weight) {
        return Result.ok(orderService.quote(type, urgent, weight));
    }

    @Operation(summary = "发布订单")
    @PostMapping
    public Result<OrderVO> publish(@AuthenticationPrincipal LoginUser loginUser,
                                   @Valid @RequestBody PublishOrderRequest request) {
        return Result.ok(orderService.publish(loginUser.id(), request));
    }

    @Operation(summary = "订单大厅")
    @GetMapping("/hall")
    public Result<PageResult<OrderVO>> hall(@AuthenticationPrincipal LoginUser loginUser,
                                            @RequestParam(required = false) String type,
                                            @RequestParam(required = false) String keyword,
                                            @RequestParam(defaultValue = "1") long page,
                                            @RequestParam(defaultValue = "10") long size) {
        return Result.ok(orderService.hall(loginUser.id(), type, keyword, page, size));
    }

    @Operation(summary = "我发布的订单")
    @GetMapping("/mine/published")
    public Result<PageResult<OrderVO>> published(@AuthenticationPrincipal LoginUser loginUser,
                                                 @RequestParam(required = false) String status,
                                                 @RequestParam(defaultValue = "1") long page,
                                                 @RequestParam(defaultValue = "10") long size) {
        return Result.ok(orderService.minePublished(loginUser.id(), status, page, size));
    }

    @Operation(summary = "我接的订单")
    @GetMapping("/mine/accepted")
    public Result<PageResult<OrderVO>> accepted(@AuthenticationPrincipal LoginUser loginUser,
                                                @RequestParam(required = false) String status,
                                                @RequestParam(defaultValue = "1") long page,
                                                @RequestParam(defaultValue = "10") long size) {
        return Result.ok(orderService.mineAccepted(loginUser.id(), status, page, size));
    }

    @Operation(summary = "订单详情")
    @GetMapping("/{id}")
    public Result<OrderVO> detail(@AuthenticationPrincipal LoginUser loginUser,
                                  @PathVariable Long id) {
        return Result.ok(orderService.detail(id, loginUser.id(), "ADMIN".equals(loginUser.role())));
    }

    @Operation(summary = "接单")
    @PostMapping("/{id}/accept")
    public Result<OrderVO> accept(@AuthenticationPrincipal LoginUser loginUser,
                                  @PathVariable Long id) {
        return Result.ok(orderService.accept(id, loginUser.id()));
    }

    @Operation(summary = "确认取件")
    @PostMapping("/{id}/pickup")
    public Result<OrderVO> pickup(@AuthenticationPrincipal LoginUser loginUser,
                                  @PathVariable Long id) {
        return Result.ok(orderService.pickup(id, loginUser.id()));
    }

    @Operation(summary = "确认送达")
    @PostMapping("/{id}/deliver")
    public Result<OrderVO> deliver(@AuthenticationPrincipal LoginUser loginUser,
                                   @PathVariable Long id) {
        return Result.ok(orderService.deliver(id, loginUser.id()));
    }

    @Operation(summary = "确认完成")
    @PostMapping("/{id}/complete")
    public Result<OrderVO> complete(@AuthenticationPrincipal LoginUser loginUser,
                                    @PathVariable Long id) {
        return Result.ok(orderService.complete(id, loginUser.id()));
    }

    @Operation(summary = "取消订单")
    @PostMapping("/{id}/cancel")
    public Result<OrderVO> cancel(@AuthenticationPrincipal LoginUser loginUser,
                                  @PathVariable Long id,
                                  @RequestBody(required = false) CancelOrderRequest request) {
        String reason = request == null ? null : request.reason();
        return Result.ok(orderService.cancel(id, loginUser.id(), reason));
    }

    @Operation(summary = "评价跑腿员")
    @PostMapping("/{id}/review")
    public Result<ReviewVO> review(@AuthenticationPrincipal LoginUser loginUser,
                                   @PathVariable Long id,
                                   @Valid @RequestBody ReviewRequest request) {
        return Result.ok(orderService.review(id, loginUser.id(), request));
    }
}
