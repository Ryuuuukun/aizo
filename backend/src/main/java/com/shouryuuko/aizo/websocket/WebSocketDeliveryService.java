package com.shouryuuko.aizo.websocket;

import com.shouryuuko.aizo.delivery.DeliveryEvent;
import com.shouryuuko.aizo.delivery.DeliveryEventPublisher;
import com.shouryuuko.aizo.delivery.DeliveryEventTarget;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WebSocketDeliveryService implements DeliveryEventPublisher {
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void publish(DeliveryEvent event, DeliveryEventTarget target) {
        switch (target.getType()) {
            case USER -> messagingTemplate.convertAndSendToUser(target.getId(), target.getDestination(), event);
            case TOPIC -> messagingTemplate.convertAndSend(target.getId(), event);
        }
    }
}
