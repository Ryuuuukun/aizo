package com.shouryuuko.aizo.services;

import com.shouryuuko.aizo.dto.user.UserResponse;
import com.shouryuuko.aizo.entity.User;
import com.shouryuuko.aizo.map.UserMapper;
import com.shouryuuko.aizo.repository.UserRepository;
import com.shouryuuko.aizo.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final CurrentUserProvider userProvider;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional
    public void synchronizeUser(Jwt jwt) {
        var subject = jwt.getSubject();
        var username = jwt.getClaimAsString("preferred_username");
        if (subject == null || subject.isBlank()) {
            throw new IllegalStateException("The subject of the JWT token cannot be empty.");
        }

        userRepository.findByKeycloak(UUID.fromString(subject))
                .ifPresentOrElse(
                        user -> {
                            if (!user.getUsername().equals(username)) {
                                user.setUsername(username);
                                userRepository.save(user);
                            }
                        },
                        () -> userRepository.save(User.builder()
                                .keycloak(UUID.fromString(subject))
                                .username(username)
                                .build())
                );
    }

    public UserResponse getCurrentUser() {
        return userMapper.toResponse(userProvider.getCurrentUser());
    }
}
