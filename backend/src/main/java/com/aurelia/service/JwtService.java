package com.aurelia.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.MacAlgorithm;
import jakarta.annotation.PostConstruct;
import jakarta.ejb.Singleton;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

@Singleton
public class JwtService {

    private static final long EXPIRY_MS = 24L * 60 * 60 * 1000;
    private static final MacAlgorithm ALG = Jwts.SIG.HS256;

    private SecretKey key;

    @PostConstruct
    void init() {
        String secret = System.getenv("JWT_SECRET");
        if (secret == null || secret.isBlank()) {
            secret = System.getProperty("JWT_SECRET");
        }
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET environment variable is not set");
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        // HS256 requires exactly 32 bytes; truncate or pad
        byte[] key32 = new byte[32];
        System.arraycopy(bytes, 0, key32, 0, Math.min(bytes.length, 32));
        this.key = Keys.hmacShaKeyFor(key32);
    }

    public String generateToken(String userId, String email) {
        return Jwts.builder()
                .subject(userId)
                .claim("email", email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRY_MS))
                .signWith(key, ALG)
                .compact();
    }

    public Optional<Claims> parseToken(String token) {
        try {
            return Optional.of(
                    Jwts.parser().verifyWith(key).build()
                            .parseSignedClaims(token)
                            .getPayload());
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
