package com.shouryuuko.aizo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameState {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "last_turn_id")
    private User lastTurn;

    @ManyToOne
    @JoinColumn(name = "turn_id")
    private User turn;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "board",  columnDefinition = "json")
    private Board board;
}
