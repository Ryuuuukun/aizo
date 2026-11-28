package com.shouryuuko.aizo.dto.session;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionCreateRequest {
    private Integer size;
    private String name;
    private Long timerLimit;
}
