package com.aurelia.dto;

public class ApiError {
    public String error;
    public String message;

    public ApiError(String error, String message) {
        this.error = error;
        this.message = message;
    }

    public static ApiError of(String message) {
        return new ApiError("error", message);
    }
}
