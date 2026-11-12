package com.campus.errand.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.campus.errand.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Mapper
public interface UserMapper extends BaseMapper<User> {

    /**
     * 行锁读取用户，用于余额扣减、结算等资金操作。
     */
    @Select("SELECT * FROM sys_user WHERE id = #{id} FOR UPDATE")
    User selectByIdForUpdate(@Param("id") Long id);

    @Update("UPDATE sys_user SET balance = balance + #{amount}, updated_at = #{now} WHERE id = #{id}")
    int increaseBalance(@Param("id") Long id, @Param("amount") BigDecimal amount, @Param("now") LocalDateTime now);

    @Update("UPDATE sys_user SET balance = balance - #{amount}, updated_at = #{now} " +
            "WHERE id = #{id} AND balance >= #{amount}")
    int deductBalance(@Param("id") Long id, @Param("amount") BigDecimal amount, @Param("now") LocalDateTime now);

    @Update("UPDATE sys_user SET credit_score = LEAST(100, GREATEST(0, credit_score + #{delta})), " +
            "updated_at = #{now} WHERE id = #{id}")
    int adjustCredit(@Param("id") Long id, @Param("delta") int delta, @Param("now") LocalDateTime now);
}
