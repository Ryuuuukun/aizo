package com.shouryuuko.aizo.services;

import com.shouryuuko.aizo.delivery.DeliveryEvent;
import com.shouryuuko.aizo.delivery.DeliveryEventPublisher;
import com.shouryuuko.aizo.delivery.DeliveryEventTarget;
import com.shouryuuko.aizo.entity.Session;
import com.shouryuuko.aizo.map.SessionMapper;
import com.shouryuuko.aizo.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionIdleCleanupService {

    private static final long IDLE_TIMEOUT_MINUTES = 5;

    private final SessionRepository sessionRepository;
    private final SessionMapper sessionMapper;
    private final DeliveryEventPublisher eventPublisher;

    @Scheduled(fixedDelayString = "PT30S")
    @Transactional
    public void finishIdleSessions() {
        var cutoff = LocalDateTime.now().minusMinutes(IDLE_TIMEOUT_MINUTES);
        List<Session> idle = sessionRepository.findIdleSessions(cutoff);
        if (idle.isEmpty()) {
            return;
        }

        log.info("Finishing {} idle session(s), cutoff={}", idle.size(), cutoff);

        for (Session session : idle) {
            session.setStatus(Session.GameStatus.FINISHED);
            session.setFinishedAt(LocalDateTime.now());
            session.setLastActivityAt(LocalDateTime.now());
            sessionRepository.save(session);

            var event = DeliveryEvent.builder()
                    .type("SESSION_FINISHED")
                    .payload(sessionMapper.toResponse(session))
                    .build();

            eventPublisher.publish(event,
                    DeliveryEventTarget.user(session.getCreator().getKeycloak().toString(), "/queue/session"));
            if (session.getOpponent() != null) {
                eventPublisher.publish(event,
                        DeliveryEventTarget.user(session.getOpponent().getKeycloak().toString(), "/queue/session"));
            }
        }
    }
}