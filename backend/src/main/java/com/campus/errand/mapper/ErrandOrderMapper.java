package com.campus.errand.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.campus.errand.entity.ErrandOrder;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;

@Mapper
public interface ErrandOrderMapper extends BaseMapper<ErrandOrder> {

    /**
     * 条件更新接单：只有仍处于待接单状态且接单者不是发布者时才会成功。
     * 这是防止两名跑腿员同时接同一单的关键。
     */
    @Update("UPDATE errand_order SET runner_id = #{runnerId}, status = 'ACCEPTED', accept_at = #{now}, " +
            "updated_at = #{now} WHERE id = #{orderId} AND status = 'PENDING' " +
            "AND publisher_id <> #{runnerId}")
    int acceptOrder(@Param("orderId") Long orderId, @Param("runnerId") Long runnerId,
                    @Param("now") LocalDateTime now);

    @Update("UPDATE errand_order SET status = 'PICKED_UP', pickup_at = #{now}, updated_at = #{now} " +
            "WHERE id = #{orderId} AND runner_id = #{runnerId} AND status = 'ACCEPTED'")
    int markPickedUp(@Param("orderId") Long orderId, @Param("runnerId") Long runnerId,
                     @Param("now") LocalDateTime now);

    @Update("UPDATE errand_order SET status = 'DELIVERED', deliver_at = #{now}, updated_at = #{now} " +
            "WHERE id = #{orderId} AND runner_id = #{runnerId} AND status = 'PICKED_UP'")
    int markDelivered(@Param("orderId") Long orderId, @Param("runnerId") Long runnerId,
                      @Param("now") LocalDateTime now);

    @Update("UPDATE errand_order SET status = 'COMPLETED', pay_status = 'SETTLED', finish_at = #{now}, " +
            "updated_at = #{now} WHERE id = #{orderId} AND publisher_id = #{publisherId} " +
            "AND status = 'DELIVERED'")
    int markCompleted(@Param("orderId") Long orderId, @Param("publisherId") Long publisherId,
                      @Param("now") LocalDateTime now);

    @Update("UPDATE errand_order SET status = 'CANCELLED', pay_status = 'REFUNDED', cancel_at = #{now}, " +
            "cancel_reason = #{reason}, updated_at = #{now} WHERE id = #{orderId} " +
            "AND publisher_id = #{publisherId} AND status = 'PENDING'")
    int cancelPending(@Param("orderId") Long orderId, @Param("publisherId") Long publisherId,
                      @Param("reason") String reason, @Param("now") LocalDateTime now);

    @Update("UPDATE errand_order SET status = 'CANCELLED', pay_status = 'REFUNDED', cancel_at = #{now}, " +
            "cancel_reason = #{reason}, updated_at = #{now} WHERE id = #{orderId} " +
            "AND status IN ('PENDING', 'ACCEPTED')")
    int adminCancel(@Param("orderId") Long orderId, @Param("reason") String reason,
                    @Param("now") LocalDateTime now);
}
