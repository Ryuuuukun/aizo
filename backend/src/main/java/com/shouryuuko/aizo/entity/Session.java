package com.shouryuuko.aizo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "game_sessions")
public class Session {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @ManyToOne
    @JoinColumn(name = "opponent_id")
    private User opponent;

    @Enumerated(EnumType.STRING)
    private GameStatus status;

    @ManyToOne
    @JoinColumn(name = "current_player_id")
    private User turnPlayer;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "current_state")
    private GameState currentState;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "state_history")
    private List<GameState> stateHistory = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

    public enum GameStatus {
        WAITING,
        ACTIVE,
        FINISHED,
        OFFERING
    }
}