package com.shouryuuko.aizo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

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

    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

    private Long creatorTimeLeftMs; 
    private Long opponentTimeLeftMs;
    private Instant turnStartedAt;   
    private Long timeLimit;
    public enum GameStatus {
        WAITING,
        ACTIVE,
        FINISHED,
        OFFERING
    }
}