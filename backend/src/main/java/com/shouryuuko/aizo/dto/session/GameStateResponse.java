package com.shouryuuko.aizo.dto.session;

import com.shouryuuko.aizo.entity.Board;
import com.shouryuuko.aizo.entity.User;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameStateResponse {
    private UUID id;

    private User lastTurn;
    private User turn;

    private Board board;
}
