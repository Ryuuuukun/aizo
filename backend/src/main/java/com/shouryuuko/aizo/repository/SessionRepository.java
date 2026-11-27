package com.shouryuuko.aizo.repository;

import com.shouryuuko.aizo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<User, UUID> {
    List<Session> findAllByStatus(GameStatus status);

    List<Session> findAllByCreatorOrOpponent(User creator, User opponent);
}
