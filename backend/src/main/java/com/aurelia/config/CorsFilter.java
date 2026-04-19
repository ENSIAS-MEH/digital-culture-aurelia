package com.aurelia.config;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Provider
public class CorsFilter implements ContainerResponseFilter {

    private static final Set<String> ALLOWED_ORIGINS = buildAllowedOrigins();

    private static Set<String> buildAllowedOrigins() {
        String raw = System.getenv("CORS_ORIGIN");
        if (raw == null || raw.isBlank()) raw = "http://localhost:5173";
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    @Override
    public void filter(ContainerRequestContext req, ContainerResponseContext res) throws IOException {
        String origin = req.getHeaderString("Origin");
        String allowed = (origin != null && ALLOWED_ORIGINS.contains(origin))
                ? origin
                : ALLOWED_ORIGINS.iterator().next();

        res.getHeaders().add("Access-Control-Allow-Origin", allowed);
        res.getHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        res.getHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.getHeaders().add("Access-Control-Allow-Credentials", "true");
        res.getHeaders().add("Vary", "Origin");
    }
}
