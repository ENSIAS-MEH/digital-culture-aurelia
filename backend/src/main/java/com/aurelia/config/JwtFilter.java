package com.aurelia.config;

import com.aurelia.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.ejb.EJB;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;

@Provider
public class JwtFilter implements ContainerRequestFilter {

    @EJB
    private JwtService jwtService;

    @Override
    public void filter(ContainerRequestContext ctx) throws IOException {
        // Allow CORS preflight through
        if ("OPTIONS".equalsIgnoreCase(ctx.getMethod())) return;

        // Public endpoints
        String path = ctx.getUriInfo().getPath();
        if (path.startsWith("auth/") || path.equals("health")) return;

        String auth = ctx.getHeaderString("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            abort(ctx);
            return;
        }

        Claims claims = jwtService.parseToken(auth.substring(7)).orElse(null);
        if (claims == null) {
            abort(ctx);
            return;
        }

        ctx.setProperty("userId", claims.getSubject());
        ctx.setProperty("email", claims.get("email", String.class));
    }

    private void abort(ContainerRequestContext ctx) {
        ctx.abortWith(Response.status(Response.Status.UNAUTHORIZED)
                .entity("{\"error\":\"Unauthorized\"}")
                .type("application/json")
                .build());
    }
}
