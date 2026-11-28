package com.shouryuuko.aizo.dto.session;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionCreateRequest {
    private final Integer size;
    private final Long timerLimit;
}
