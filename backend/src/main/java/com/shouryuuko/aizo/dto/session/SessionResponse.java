package com.shouryuuko.aizo.dto.session;

import com.shouryuuko.aizo.dto.user.UserResponse;
import com.shouryuuko.aizo.entity.Board;
import com.shouryuuko.aizo.entity.GameState;
import com.shouryuuko.aizo.entity.Session;
import lombok.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {
    private UUID id;

    private String name;

    private UserResponse creator;
    private UserResponse opponent;
    private UserResponse turnPlayer;
    private Board board;

    private Session.GameStatus status;

    private GameStateResponse state;
    private List<GameStateResponse> history;

    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

    private Long creatorRemainingMs;
    private Long opponentRemainingMs;
    private Instant serverTime;
    private Long timeLimit;
}
