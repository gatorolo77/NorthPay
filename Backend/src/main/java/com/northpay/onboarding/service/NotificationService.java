package com.northpay.onboarding.service;

import com.northpay.onboarding.model.Notification;
import com.northpay.onboarding.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void sendNotification(Long userId, String message, String type) {
        Notification notification = Notification.builder()
                .userId(userId)
                .message(message)
                .type(type)
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        // Simulate channels dispersion elimination by automatically routing to a unified event stream
        log.info("[NOTIFICATION LOG] To User ID: {}. Type: {}. Message: '{}'", userId, type, message);
        log.info("[NOTIFICATION MOCK] Automated email sent to registered user's address.");
        log.info("[NOTIFICATION MOCK] Unified WhatsApp notification pushed to user's registered number.");
    }

    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        });
    }
}
