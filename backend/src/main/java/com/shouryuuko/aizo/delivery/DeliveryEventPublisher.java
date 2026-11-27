package com.shouryuuko.aizo.delivery;

public interface DeliveryEventPublisher {
    void publish(DeliveryEvent event, DeliveryEventTarget target);
}
