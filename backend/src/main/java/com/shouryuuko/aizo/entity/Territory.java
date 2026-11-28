package com.shouryuuko.aizo.entity;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Territory {
    private UUID owner;
    private List<Point> points;
}
