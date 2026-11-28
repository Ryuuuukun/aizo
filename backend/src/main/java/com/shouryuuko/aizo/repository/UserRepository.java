package com.shouryuuko.aizo.repository;

import com.shouryuuko.aizo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findFirstByKeycloakOrderByIdAsc(UUID keycloak);
}
