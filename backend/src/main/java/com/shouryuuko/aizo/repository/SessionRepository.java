package com.shouryuuko.aizo.repository;

import com.shouryuuko.aizo.entity.Session;
import com.shouryuuko.aizo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {
    List<Session> findAllByStatus(Session.GameStatus status);
    List<Session> findAllByCreatorOrOpponent(User creator, User opponent);

    Optional<Session> findByCreatorOrOpponent(User creator, User opponent);

    Optional<Session> findByCreatorAndStatusInOrOpponentAndStatusIn(
            User creator, Collection<Session.GameStatus> statuses1,
            User opponent, Collection<Session.GameStatus> statuses2
    );

    default Optional<Session> findByUserAndStatusIn(User user, Collection<Session.GameStatus> statuses) {
        return findByCreatorAndStatusInOrOpponentAndStatusIn(user, statuses, user, statuses);
    }
}
