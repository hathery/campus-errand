package com.campus.errand.service.impl;

import com.campus.errand.common.BusinessException;
import com.campus.errand.enums.OrderType;
import com.campus.errand.vo.FeeQuoteVO;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 配送费计算规则：
 * 基础价（按类型） + 加急费 2 元 + 超出 5kg 部分每公斤 1 元（向上取整，最高 5 元）。
 * 平台服务费为订单金额的 10%。
 */
@Service
public class FeeCalculator {

    private static final BigDecimal URGENT_FEE = new BigDecimal("2.00");
    private static final BigDecimal FREE_WEIGHT = new BigDecimal("5.0");
    private static final BigDecimal WEIGHT_UNIT_FEE = new BigDecimal("1.00");
    private static final BigDecimal MAX_WEIGHT_FEE = new BigDecimal("5.00");
    private static final BigDecimal COMMISSION_RATE = new BigDecimal("0.10");

    public FeeQuoteVO quote(String typeValue, Integer urgent, BigDecimal weight) {
        OrderType type = OrderType.of(typeValue);
        if (type == null) {
            throw new BusinessException("不支持的跑腿类型");
        }
        BigDecimal actualWeight = weight == null ? BigDecimal.ONE : weight;
        if (actualWeight.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("物品重量必须大于 0");
        }

        BigDecimal urgentFee = Integer.valueOf(1).equals(urgent)
                ? URGENT_FEE : BigDecimal.ZERO.setScale(2);
        BigDecimal weightFee = BigDecimal.ZERO.setScale(2);
        if (actualWeight.compareTo(FREE_WEIGHT) > 0) {
            BigDecimal extraKg = actualWeight.subtract(FREE_WEIGHT)
                    .setScale(0, RoundingMode.CEILING);
            weightFee = extraKg.multiply(WEIGHT_UNIT_FEE).min(MAX_WEIGHT_FEE).setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal total = type.getBaseFee().add(urgentFee).add(weightFee).setScale(2, RoundingMode.HALF_UP);

        String ruleText = "基础价 " + type.getBaseFee().stripTrailingZeros().toPlainString() + " 元"
                + " + 加急 " + urgentFee.stripTrailingZeros().toPlainString() + " 元"
                + " + 超重 " + weightFee.stripTrailingZeros().toPlainString() + " 元";
        return new FeeQuoteVO(type.name(), type.getLabel(), type.getBaseFee(), urgentFee, weightFee, total, ruleText);
    }

    public BigDecimal commission(BigDecimal amount) {
        return amount.multiply(COMMISSION_RATE).setScale(2, RoundingMode.HALF_UP);
    }
}
