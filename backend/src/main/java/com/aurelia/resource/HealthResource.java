package com.aurelia.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import java.util.Map;

@Path("health")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Health")
public class HealthResource {

    @GET
    @Operation(summary = "Service health check")
    public Response health() {
        return Response.ok(Map.of("status", "ok", "service", "aurelia-backend")).build();
    }
}
