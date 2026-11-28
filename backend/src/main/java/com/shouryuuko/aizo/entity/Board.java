package com.shouryuuko.aizo.entity;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Board {
    private Integer size;
    @Builder.Default
    private List<List<String>> points = new ArrayList<>();
    @Builder.Default
    private List<Territory> territories = new ArrayList<>();
}
