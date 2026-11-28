package com.shouryuuko.aizo.dto.session;

import com.shouryuuko.aizo.entity.GameState;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionHistoryResponse {
    private UUID sessionId;
    private List<GameState> states;
    private Integer currentIndex;
}