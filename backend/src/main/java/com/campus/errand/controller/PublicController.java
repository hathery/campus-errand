package com.campus.errand.controller;

import com.campus.errand.common.Result;
import com.campus.errand.service.impl.OrderService;
import com.campus.errand.vo.PublicStatsVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "公开数据")
@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final OrderService orderService;

    public PublicController(OrderService orderService) {
        this.orderService = orderService;
    }

    @Operation(summary = "首页公开统计")
    @GetMapping("/stats")
    public Result<PublicStatsVO> stats() {
        return Result.ok(orderService.publicStats());
    }
}
