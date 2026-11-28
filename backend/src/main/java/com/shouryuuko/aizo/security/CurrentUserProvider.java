package com.shouryuuko.aizo.security;

import com.shouryuuko.aizo.entity.User;
import com.shouryuuko.aizo.exception.NotFoundException;
import com.shouryuuko.aizo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CurrentUserProvider {
    private final UserRepository userRepository;

    public UUID getCurrentKeycloakId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt
                && jwt.getSubject() != null && !jwt.getSubject().isBlank()) {

            return UUID.fromString(jwt.getSubject());
        }

        throw new IllegalStateException("The user is not authenticated or the token is missing.");
    }

    public UUID getCurrentUserId() {
        return getCurrentUser().getId();
    }

    public User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt
                && jwt.getSubject() != null && !jwt.getSubject().isBlank()) {

            return userRepository.findFirstByKeycloakOrderByIdAsc(UUID.fromString(jwt.getSubject()))
                    .orElseThrow(() -> new NotFoundException("User was not found."));
        }

        throw new IllegalStateException("The user is not authenticated or the token is missing.");
    }
}
