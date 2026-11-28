package com.shouryuuko.aizo.repository;

import com.shouryuuko.aizo.entity.Session;
import com.shouryuuko.aizo.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {
    List<Session> findAllByStatus(Session.GameStatus status, Pageable pageable);

    @Query("SELECT COUNT(s) > 0 FROM Session s WHERE (s.creator = :user OR s.opponent = :user) AND s.status <> com.shouryuuko.aizo.entity.Session.GameStatus.FINISHED")
    boolean hasUnfinishedSessions(@Param("user") User user);

    @Query("""
    SELECT s FROM Session s
        WHERE (s.creator = :user OR s.opponent = :user)
          AND s.status <> com.shouryuuko.aizo.entity.Session.GameStatus.FINISHED
        ORDER BY s.createdAt DESC
    """)
    List<Session> findFirstUnfinishedSession(@Param("user") User user);

    default List<Session> findUnfinishedSessions(User user) {
        return findFirstUnfinishedSession(user);
    }
}
