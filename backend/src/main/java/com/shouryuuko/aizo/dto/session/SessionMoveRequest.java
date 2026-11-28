package com.shouryuuko.aizo.dto.session;

import com.shouryuuko.aizo.entity.Board;
import com.shouryuuko.aizo.entity.Territory;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionMoveRequest {
    private Board board;
    private Territory territory;
}
