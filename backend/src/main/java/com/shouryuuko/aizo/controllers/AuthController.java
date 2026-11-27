package com.shouryuuko.aizo.controllers;

import com.shouryuuko.aizo.dto.user.UserResponse;
import com.shouryuuko.aizo.map.UserMapper;
import com.shouryuuko.aizo.security.CurrentUserProvider;
import com.shouryuuko.aizo.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }
}
