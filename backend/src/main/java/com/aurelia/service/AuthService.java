package com.aurelia.service;

import com.aurelia.dto.AuthResponse;
import com.aurelia.dto.LoginRequest;
import com.aurelia.dto.RegisterRequest;
import com.aurelia.model.User;
import com.aurelia.repository.UserRepository;
import jakarta.ejb.EJB;
import jakarta.ejb.Stateless;
import org.mindrot.jbcrypt.BCrypt;

@Stateless
public class AuthService {

    @EJB
    private UserRepository userRepository;

    @EJB
    private JwtService jwtService;

    public AuthResponse register(RegisterRequest req) {
        if (req.email == null || req.email.isBlank())
            throw new IllegalArgumentException("Email is required");
        if (req.password == null || req.password.length() < 8)
            throw new IllegalArgumentException("Password must be at least 8 characters");
        if (userRepository.existsByEmail(req.email.toLowerCase()))
            throw new IllegalStateException("Email already registered");

        User user = new User();
        user.setEmail(req.email.toLowerCase().trim());
        user.setPasswordHash(BCrypt.hashpw(req.password, BCrypt.gensalt(12)));
        user.setFullName(req.fullName);
        userRepository.save(user);

        String token = jwtService.generateToken(user.getId().toString(), user.getEmail());
        return new AuthResponse(token, user.getId().toString(), user.getEmail(), user.getFullName());
    }

    public AuthResponse login(LoginRequest req) {
        if (req.email == null || req.password == null)
            throw new IllegalArgumentException("Email and password are required");

        User user = userRepository.findByEmail(req.email.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!BCrypt.checkpw(req.password, user.getPasswordHash()))
            throw new IllegalArgumentException("Invalid email or password");

        String token = jwtService.generateToken(user.getId().toString(), user.getEmail());
        return new AuthResponse(token, user.getId().toString(), user.getEmail(), user.getFullName());
    }
}
