package com.aurelia.resource;

import com.aurelia.dto.ApiError;
import com.aurelia.dto.AuthResponse;
import com.aurelia.dto.LoginRequest;
import com.aurelia.dto.RegisterRequest;
import com.aurelia.service.AuthService;
import jakarta.ejb.EJB;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Auth", description = "Registration and login")
public class AuthResource {

    @EJB private AuthService authService;

    @POST
    @Path("register")
    @Operation(summary = "Register a new user")
    public Response register(RegisterRequest req) {
        try {
            AuthResponse resp = authService.register(req);
            return Response.status(201).entity(resp).build();
        } catch (IllegalArgumentException e) {
            return Response.status(400).entity(ApiError.of(e.getMessage())).build();
        } catch (IllegalStateException e) {
            return Response.status(409).entity(ApiError.of(e.getMessage())).build();
        }
    }

    @POST
    @Path("login")
    @Operation(summary = "Login and receive a JWT")
    public Response login(LoginRequest req) {
        try {
            AuthResponse resp = authService.login(req);
            return Response.ok(resp).build();
        } catch (IllegalArgumentException e) {
            return Response.status(401).entity(ApiError.of(e.getMessage())).build();
        }
    }
}
