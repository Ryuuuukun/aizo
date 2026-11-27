package com.shouryuuko.aizo.map;

import com.shouryuuko.aizo.dto.session.SessionResponse;
import com.shouryuuko.aizo.entity.Session;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        uses = { UserMapper.class })
public interface SessionMapper {
    SessionResponse toResponse(Session session);
    List<SessionResponse> toResponses(List<Session> sessions);
}
