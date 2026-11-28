package com.shouryuuko.aizo.services;

import com.shouryuuko.aizo.delivery.DeliveryEvent;
import com.shouryuuko.aizo.delivery.DeliveryEventPublisher;
import com.shouryuuko.aizo.delivery.DeliveryEventTarget;
import com.shouryuuko.aizo.dto.session.SessionCreateRequest;
import com.shouryuuko.aizo.dto.session.SessionMoveRequest;
import com.shouryuuko.aizo.dto.session.SessionResponse;
import com.shouryuuko.aizo.entity.Board;
import com.shouryuuko.aizo.entity.GameState;
import com.shouryuuko.aizo.entity.Session;
import com.shouryuuko.aizo.exception.NotFoundException;
import com.shouryuuko.aizo.exception.SessionBadRequestException;
import com.shouryuuko.aizo.exception.SessionConflictException;
import com.shouryuuko.aizo.exception.SessionFullException;
import com.shouryuuko.aizo.map.GameStateMapper;
import com.shouryuuko.aizo.map.SessionMapper;
import com.shouryuuko.aizo.repository.SessionRepository;
import com.shouryuuko.aizo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SessionService {
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    private final SessionMapper sessionMapper;
    private final GameStateMapper gameStateMapper;

    private final DeliveryEventPublisher eventPublisher;

    @Transactional
    public SessionResponse createSession(UUID userId, SessionCreateRequest request) {
        var user = this.userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User was not found."));

        var session = Session.builder()
                .creator(user)
                .name(request.getName())
                .state(GameState.builder()
                        .board(Board.builder()
                                .size(request.getSize())
                                .build())
                        .build())
                .status(Session.GameStatus.WAITING)
                .createdAt(LocalDateTime.now())
                .timeLimit(request.getTimerLimit())
                .creatorTimeLeftMs(request.getTimerLimit())
                .opponentTimeLeftMs(request.getTimerLimit())
                .build();

        return this.sessionMapper.toResponse(this.sessionRepository.save(session));
    }

    @Transactional
    public SessionResponse joinSession(UUID userId, UUID sessionId) {
        var user = this.userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User was not found"));
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
        session.setTurnPlayer(session.getCreator());
        session.getState().setTurn(session.getCreator());
        session.setTurnStartedAt(Instant.now());

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
            session.setFinishedAt(LocalDateTime.now());

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
    public SessionResponse makeMove(UUID userId, UUID sessionId, SessionMoveRequest request) {
        var user = this.userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User was not found."));
        var session = this.sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session was not found."));
        if (session.getStatus() == Session.GameStatus.FINISHED) {
            throw new SessionBadRequestException("Session is finished.");
        }

        if (!session.getOpponent().getId().equals(user.getId()) && !session.getCreator().getId().equals(user.getId())) {
            throw new SessionBadRequestException("Only member session can make move.");
        }

        if (!session.getState().getTurn().getId().equals(user.getId())) {
            throw new SessionBadRequestException("Not your turn");
        }

        var state = this.gameStateMapper.clone(session.getState());

        state.setBoard(request.getBoard());
        state.setLastTurn(state.getTurn());
        if (session.getTurnStartedAt() != null) {
            long elapsedMs = Math.max(0L,
                    java.time.Duration.between(session.getTurnStartedAt(), Instant.now()).toMillis());
            if (session.getCreator().getId().equals(state.getTurn().getId())) {
                if (session.getCreatorTimeLeftMs() != null) {
                    session.setCreatorTimeLeftMs(Math.max(0L, session.getCreatorTimeLeftMs() - elapsedMs));
                }
            } else if (session.getOpponentTimeLeftMs() != null) {
                session.setOpponentTimeLeftMs(Math.max(0L, session.getOpponentTimeLeftMs() - elapsedMs));
            }
        }
        if (session.getCreator().getId().equals(state.getTurn().getId())) {
            state.setTurn(session.getOpponent());
        } else {
            state.setTurn(session.getCreator());
        }
        session.setTurnPlayer(state.getTurn());
        session.setTurnStartedAt(Instant.now());

        var response = this.sessionMapper.toResponse(this.sessionRepository.save(session));
        var event = DeliveryEvent.builder()
                .type("SESSION_CAN_MOVE")
                .payload(response)
                .build();
        if (session.getCreator().getId().equals(state.getTurn().getId())) {
            eventPublisher.publish(
                    event, DeliveryEventTarget.user(session.getCreator().getKeycloak().toString(), "/queue/session"));
        } else {
            eventPublisher.publish(
                    event, DeliveryEventTarget.user(session.getOpponent().getKeycloak().toString(), "/queue/session")
            );
        }

        return response;
    }

    @Transactional
    public List<SessionResponse> getAllSessions() {
        return this.sessionMapper.toResponses(this.sessionRepository.findAll());
    }

    @Transactional
    public SessionResponse getSession(UUID sessionId) {
        return this.sessionRepository.findById(sessionId)
                .map(this.sessionMapper::toResponse)
                .orElseThrow(() -> new NotFoundException("Session was not found"));
    }

    @Transactional
    public Page<SessionResponse> getWaitingSessions(Pageable pageable) {
        return this.sessionRepository.findAllByStatus(Session.GameStatus.WAITING, pageable)
                .map(this.sessionMapper::toResponse);
    }

    @Transactional
    public List<SessionResponse> getActiveSession(UUID userId) {
        var user = this.userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User was not found."));
        var sessions = this.sessionRepository.findUnfinishedSessions(user);

        return this.sessionMapper.toResponses(sessions);
    }
}
