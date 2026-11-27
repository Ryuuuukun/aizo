package com.shouryuuko.aizo.delivery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class DeliveryEvent {
    private String type;
    private Object subject;
}
