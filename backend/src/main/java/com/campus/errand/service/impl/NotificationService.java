package com.campus.errand.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.errand.common.PageResult;
import com.campus.errand.entity.Notification;
import com.campus.errand.enums.NotificationType;
import com.campus.errand.mapper.NotificationMapper;
import com.campus.errand.vo.NotificationVO;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 站内通知服务。业务动作产生通知，前端通过未读数量轮询提醒。
 */
@Service
public class NotificationService {

    private final NotificationMapper notificationMapper;

    public NotificationService(NotificationMapper notificationMapper) {
        this.notificationMapper = notificationMapper;
    }

    public void send(Long userId, String title, String content, String type) {
        if (userId == null) {
            return;
        }
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setType(type == null ? NotificationType.SYSTEM : type);
        notification.setReadFlag(0);
        notification.setCreatedAt(LocalDateTime.now());
        notificationMapper.insert(notification);
    }

    public PageResult<NotificationVO> page(Long userId, long page, long size) {
        Page<Notification> p = new Page<>(Math.max(page, 1), Math.min(Math.max(size, 1), 50));
        IPage<Notification> result = notificationMapper.selectPage(p, Wrappers.<Notification>lambdaQuery()
                .eq(Notification::getUserId, userId)
                .orderByDesc(Notification::getCreatedAt)
                .orderByDesc(Notification::getId));
        List<NotificationVO> records = result.getRecords().stream()
                .map(item -> new NotificationVO(item.getId(), item.getTitle(), item.getContent(),
                        item.getType(), item.getReadFlag(), item.getCreatedAt()))
                .toList();
        return PageResult.of(records, result.getTotal(), result.getCurrent(), result.getSize());
    }

    public long unreadCount(Long userId) {
        Long count = notificationMapper.selectCount(Wrappers.<Notification>lambdaQuery()
                .eq(Notification::getUserId, userId)
                .eq(Notification::getReadFlag, 0));
        return count == null ? 0 : count;
    }

    public void markRead(Long userId, Long id) {
        notificationMapper.markRead(id, userId);
    }

    public void markAllRead(Long userId) {
        notificationMapper.markAllRead(userId);
    }
}
