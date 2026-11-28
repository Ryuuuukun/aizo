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
import com.shouryuuko.aizo.dto.session.SessionHistoryResponse;
import com.shouryuuko.aizo.entity.GameState;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class SessionService {
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    private final SessionMapper sessionMapper;

    private final DeliveryEventPublisher eventPublisher;

    private final ObjectMapper objectMapper;

    @Transactional
    public SessionResponse createSession(UUID userId, SessionCreateRequest request) {
        var user = this.userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User was not found."));
        if (this.sessionRepository.hasUnfinishedSessions(user)) {
            throw new SessionConflictException("The user cannot participate in more than one active session.");
        }

        var session = Session.builder()
                .creator(user)
                .status(Session.GameStatus.WAITING)
                .createdAt(LocalDateTime.now())
                .lastActivityAt(LocalDateTime.now())
                .stateHistory(new ArrayList<>())
                .build();

        return this.sessionMapper.toResponse(this.sessionRepository.save(session));
    }

    @Transactional
    public SessionResponse joinSession(UUID userId, UUID sessionId) {
        var user = this.userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User was not found"));
        if (this.sessionRepository.hasUnfinishedSessions(user)) {
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
        session.setLastActivityAt(LocalDateTime.now());

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
        session.setLastActivityAt(LocalDateTime.now());

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
    public void saveState(UUID sessionId, GameState newState) {
        var session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session was not found"));

        session.setCurrentState(newState);
        session.setLastActivityAt(LocalDateTime.now());

        if (session.getStateHistory() == null) {
            session.setStateHistory(new ArrayList<>());
        }

        session.getStateHistory().add(deepCopy(newState));

        sessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public SessionHistoryResponse getHistory(UUID userId, UUID sessionId){
        var session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session was not found"));

        boolean isParticipant = session.getCreator().getId().equals(userId)
                || (session.getOpponent() != null && session.getOpponent().getId().equals(userId));

        if (!isParticipant) {
            throw new SessionConflictException("Only a session participant can get the session history.");
        }

        var history = session.getStateHistory() == null
                ? List.<GameState>of()
                : session.getStateHistory();

        return SessionHistoryResponse.builder()
                .sessionId(sessionId)
                .states(history)
                .currentIndex(history.size() - 1)
                .build();

    }

    @Transactional(readOnly = true)
    public GameState getStateAt(UUID userId, UUID sessionId, int index) {
        var history = getHistory(userId, sessionId);
        if (index < 0 || index >= history.getStates().size()) {
            throw new NotFoundException("State at index " + index + " was not found");
        }
        return history.getStates().get(index);

    }

    private GameState deepCopy(GameState state) {
        return objectMapper.convertValue(state, GameState.class);
    }

    @Transactional
    public List<SessionResponse> getAllSessions() {
        return this.sessionMapper.toResponses(this.sessionRepository.findAll());
    }

    @Transactional
    public SessionResponse getActiveSession(UUID userId) {
        var user = this.userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User was not found."));
        var session = this.sessionRepository.findUnfinishedSession(user)
                .orElseThrow(() -> new NotFoundException("Session was not found."));

        return this.sessionMapper.toResponse(session);
    }
}
