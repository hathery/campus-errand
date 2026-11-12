package com.campus.errand.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.campus.errand.common.BusinessException;
import com.campus.errand.dto.LoginRequest;
import com.campus.errand.dto.RegisterRequest;
import com.campus.errand.entity.User;
import com.campus.errand.enums.Role;
import com.campus.errand.enums.RunnerStatus;
import com.campus.errand.mapper.UserMapper;
import com.campus.errand.security.JwtService;
import com.campus.errand.vo.AuthResponse;
import com.campus.errand.vo.UserVO;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 注册、登录与令牌签发。
 */
@Service
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserMapper userMapper, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.username().trim();
        String phone = request.phone().trim();
        Long count = userMapper.selectCount(Wrappers.<User>lambdaQuery()
                .eq(User::getUsername, username)
                .or()
                .eq(User::getPhone, phone));
        if (count != null && count > 0) {
            throw BusinessException.conflict("用户名或手机号已被注册");
        }

        LocalDateTime now = LocalDateTime.now();
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setNickname(request.nickname().trim());
        user.setPhone(phone);
        user.setRole(Role.USER);
        user.setRunnerStatus(RunnerStatus.NONE);
        user.setCreditScore(100);
        user.setBalance(BigDecimal.ZERO.setScale(2));
        user.setStatus(1);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        userMapper.insert(user);

        String token = jwtService.generate(user.getId(), user.getUsername(), user.getRole());
        return new AuthResponse(token, UserVO.from(user));
    }

    public AuthResponse login(LoginRequest request) {
        User user = userMapper.selectOne(Wrappers.<User>lambdaQuery()
                .eq(User::getUsername, request.username().trim())
                .last("LIMIT 1"));
        if (user == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "用户名或密码错误");
        }
        if (!Integer.valueOf(1).equals(user.getStatus())) {
            throw BusinessException.forbidden("账号已被禁用，请联系管理员");
        }
        String token = jwtService.generate(user.getId(), user.getUsername(), user.getRole());
        return new AuthResponse(token, UserVO.from(user));
    }

    public User requireUser(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw BusinessException.notFound("用户不存在");
        }
        return user;
    }
}
