package com.shouryuuko.aizo.map;

import com.shouryuuko.aizo.dto.session.SessionResponse;
import com.shouryuuko.aizo.entity.Session;

import org.mapstruct.AfterMapping;
import org.mapstruct.Mapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Mapper(componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        uses = { UserMapper.class })
public interface SessionMapper {
    @Mapping(target = "board", source = "state.board")
    SessionResponse toResponse(Session session);
    List<SessionResponse> toResponses(List<Session> sessions);

    @AfterMapping 
    default void calculateRemainingTimers(Session session, @MappingTarget SessionResponse response) {
        if (session == null) {
            return;
        }
        Instant now = Instant.now();
        response.setServerTime(now);

        long creatorLeft = session.getCreatorTimeLeftMs() != null ? session.getCreatorTimeLeftMs() : 0L;
        long opponentLeft = session.getOpponentTimeLeftMs() != null ? session.getOpponentTimeLeftMs() : 0L;
    
        if (session.getStatus() == Session.GameStatus.ACTIVE && session.getTurnStartedAt() != null && session.getTurnPlayer() != null) {
            long elapsedMs = Math.max(0L, Duration.between(session.getTurnStartedAt(), now).toMillis());

            if (session.getCreator() != null && session.getTurnPlayer().getId().equals(session.getCreator().getId())) {
                creatorLeft = Math.max(0L, creatorLeft - elapsedMs);
            } else {
                opponentLeft = Math.max(0L, opponentLeft - elapsedMs);
            }
        }

        response.setCreatorRemainingMs(creatorLeft);
        response.setOpponentRemainingMs(opponentLeft);
    }

}
