package com.shouryuuko.aizo.map;

import com.shouryuuko.aizo.dto.user.UserResponse;
import com.shouryuuko.aizo.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponse toResponse(User user);
}
