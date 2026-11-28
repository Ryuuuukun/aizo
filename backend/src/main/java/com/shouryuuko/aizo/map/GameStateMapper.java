package com.shouryuuko.aizo.map;

import com.shouryuuko.aizo.entity.GameState;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface GameStateMapper {
    @Mapping(target = "id", ignore = true)
    GameState clone(GameState source);
}
