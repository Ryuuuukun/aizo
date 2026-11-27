package com.shouryuuko.aizo.controllers;

import com.shouryuuko.aizo.dto.session.*;
import com.shouryuuko.aizo.security.CurrentUserProvider;
import com.shouryuuko.aizo.services.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/session")
public class SessionController {
    private final SessionService sessionService;
    private final CurrentUserProvider userProvider;

    @PostMapping
    public ResponseEntity<SessionResponse> postCreateSession(@RequestBody SessionCreateRequest request) {
        return ResponseEntity.ok(this.sessionService
                .createSession(this.userProvider.getCurrentUserId(), request));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<SessionResponse> postJoinSession(@PathVariable UUID id) {
        return ResponseEntity.ok(this.sessionService
                .joinSession(this.userProvider.getCurrentUserId(), id));
    }

    @PostMapping("/{id}/move")
    public ResponseEntity<Void> postMakeMove(@PathVariable UUID id, @RequestBody SessionMoveRequest request) {
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/offer")
    public ResponseEntity<SessionResponse> postOfferSession(@PathVariable UUID id) {
        return ResponseEntity.ok(this.sessionService
                .offerSession(this.userProvider.getCurrentUserId(), id));
    }

    @GetMapping("/active")
    public ResponseEntity<SessionResponse> getActiveSession() {
        return ResponseEntity.ok(this.sessionService
                .getActiveSession(this.userProvider.getCurrentUserId()));
    }

    @GetMapping
    public ResponseEntity<List<SessionResponse>> getAllSessions() {
        return ResponseEntity.ok(this.sessionService.getAllSessions());
    }
}
