package com.shouryuuko.aizo.dto.session;

import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@RequiredArgsConstructor
public class SessionCreateRequest {
    private final Integer size;
    private final Long timerLimit;
}
