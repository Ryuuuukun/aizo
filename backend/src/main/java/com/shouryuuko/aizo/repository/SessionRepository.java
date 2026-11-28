package com.shouryuuko.aizo.repository;

import com.shouryuuko.aizo.entity.Session;
import com.shouryuuko.aizo.entity.User;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    List<Session> findAllByStatus(Session.GameStatus status);
    List<Session> findAllByCreatorOrOpponent(User creator, User opponent);

    Optional<Session> findByCreatorOrOpponent(User creator, User opponent);

    @Query("SELECT COUNT(s) > 0 FROM Session s WHERE (s.creator = :user OR s.opponent = :user) AND s.status <> com.shouryuuko.aizo.entity.Session.GameStatus.FINISHED")
    boolean hasUnfinishedSessions(@Param("user") User user);

    @Query("""
    SELECT s FROM Session s
        WHERE (s.creator = :user OR s.opponent = :user)
          AND s.status <> com.shouryuuko.aizo.entity.Session.GameStatus.FINISHED
        ORDER BY s.createdAt DESC
    """)
    List<Session> findUnfinishedSessions(@Param("user") User user, Pageable pageable);

    default Optional<Session> findUnfinishedSession(User user) {
        return findUnfinishedSessions(user, PageRequest.of(0, 1)).stream().findFirst();
    }

    @Query("""
    SELECT s FROM Session s
        WHERE s.status IN (com.shouryuuko.aizo.entity.Session.GameStatus.WAITING,
                           com.shouryuuko.aizo.entity.Session.GameStatus.ACTIVE,
                           com.shouryuuko.aizo.entity.Session.GameStatus.OFFERING)
          AND s.lastActivityAt IS NOT NULL
          AND s.lastActivityAt < :cutoff
    """)
    List<Session> findIdleSessions(@Param("cutoff") LocalDateTime cutoff);
}