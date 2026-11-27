package com.shouryuuko.aizo.services;

import com.shouryuuko.aizo.delivery.DeliveryEvent;
import com.shouryuuko.aizo.delivery.DeliveryEventPublisher;
import com.shouryuuko.aizo.delivery.DeliveryEventTarget;
import com.shouryuuko.aizo.dto.session.SessionCreateRequest;
import com.shouryuuko.aizo.dto.session.SessionResponse;
import com.shouryuuko.aizo.entity.Session;
import com.shouryuuko.aizo.exception.NotFoundException;
import com.shouryuuko.aizo.exception.SessionConflictException;
import com.shouryuuko.aizo.exception.SessionFullException;
import com.shouryuuko.aizo.map.SessionMapper;
import com.shouryuuko.aizo.repository.SessionRepository;
import com.shouryuuko.aizo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SessionService {
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    private final SessionMapper sessionMapper;

    private final DeliveryEventPublisher eventPublisher;

    @Transactional
    public SessionResponse createSession(UUID userId, SessionCreateRequest request) {
        var user = this.userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User was not found."));
        if (this.sessionRepository.findByUserAndStatusIn(user,
                List.of(Session.GameStatus.ACTIVE, Session.GameStatus.WAITING, Session.GameStatus.OFFERING)).isPresent()
        ) {
            throw new SessionConflictException("The user cannot participate in more than one active session.");
        }

        var session = Session.builder()
                .creator(user)
                .status(Session.GameStatus.WAITING)
                .createdAt(LocalDateTime.now())
                .build();

        return this.sessionMapper.toResponse(this.sessionRepository.save(session));
    }

    @Transactional
    public SessionResponse joinSession(UUID userId, UUID sessionId) {
        var user = this.userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User was not found"));
        if (this.sessionRepository.findByUserAndStatusIn(user,
                List.of(Session.GameStatus.ACTIVE, Session.GameStatus.WAITING, Session.GameStatus.OFFERING)).isPresent()
        ) {
            throw new SessionConflictException("The user cannot participate in more than one active session.");
        }

        var session = this.sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session was not found"));

        if (session.getOpponent() != null) {
            throw new SessionFullException("Session is full.");
        } else if (session.getCreator().getId().equals(user.getId())) {
            throw new SessionConflictException("The creator cannot connect to their own session.");
        }

        session.setOpponent(user);
        session.setStatus(Session.GameStatus.ACTIVE);
        session.setStartedAt(LocalDateTime.now());

        var event = DeliveryEvent.builder()
                .type("SESSION_START")
                .payload(this.sessionMapper.toResponse(session))
                .build();
        this.eventPublisher.publish(event,
                DeliveryEventTarget.user(session.getCreator().getKeycloak().toString(), "/queue/session"));
        this.eventPublisher.publish(event,
                DeliveryEventTarget.user(session.getOpponent().getKeycloak().toString(), "/queue/session"));

        return this.sessionMapper.toResponse(this.sessionRepository.save(session));
    }

    @Transactional
    public SessionResponse offerSession(UUID userId, UUID sessionId) {
        var user = this.userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User was not found"));
        var session = this.sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session was not found"));

        if (!session.getCreator().getId().equals(user.getId()) && !session.getOpponent().getId().equals(user.getId())) {
            throw new SessionConflictException("Only a session participant can propose ending the session.");
        }

        if (session.getStatus() == Session.GameStatus.WAITING || session.getStatus() == Session.GameStatus.OFFERING) {
            session.setStatus(Session.GameStatus.FINISHED);

            var event = DeliveryEvent.builder()
                    .type("SESSION_FINISHED")
                    .payload(this.sessionMapper.toResponse(session))
                    .build();
            this.eventPublisher.publish(event,
                    DeliveryEventTarget.user(session.getCreator().getKeycloak().toString(), "/queue/session"));
            if (session.getOpponent() != null) {
                this.eventPublisher.publish(event,
                        DeliveryEventTarget.user(session.getOpponent().getKeycloak().toString(), "/queue/session"));
            }
        } else if (session.getStatus() == Session.GameStatus.ACTIVE) {
            session.setStatus(Session.GameStatus.OFFERING);

            var event = DeliveryEvent.builder()
                    .type("SESSION_OFFERING")
                    .payload(this.sessionMapper.toResponse(session))
                    .build();
            if (session.getCreator().getId().equals(user.getId())) {
                this.eventPublisher.publish(event,
                        DeliveryEventTarget.user(session.getOpponent().getKeycloak().toString(), "/queue/session"));
            } else {
                this.eventPublisher.publish(event,
                        DeliveryEventTarget.user(session.getCreator().getKeycloak().toString(), "/queue/session"));
            }
        }

        return this.sessionMapper.toResponse(this.sessionRepository.save(session));
    }

    @Transactional
    public List<SessionResponse> getAllSessions() {
        return this.sessionMapper.toResponses(this.sessionRepository.findAll());
    }

    @Transactional
    public SessionResponse getActiveSession(UUID userId) {
        var user = this.userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User was not found."));
        var session = this.sessionRepository.findByCreatorOrOpponent(user, user)
                .orElseThrow(() -> new NotFoundException("Session was not found."));

        return this.sessionMapper.toResponse(session);
    }
}
