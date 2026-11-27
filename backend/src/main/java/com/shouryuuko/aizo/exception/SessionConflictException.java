package com.shouryuuko.aizo.exception;

public class SessionConflictException extends RuntimeException {
    public SessionConflictException(String message) {
        super(message);
    }
}
