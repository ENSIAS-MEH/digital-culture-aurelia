package com.aurelia.dto;

public class AuthResponse {
    public String token;
    public String userId;
    public String email;
    public String fullName;

    public AuthResponse(String token, String userId, String email, String fullName) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
    }
}
