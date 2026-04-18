package com.aurelia.resource;

import com.aurelia.service.InsightService;
import com.aurelia.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.ejb.EJB;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("insights")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Insights", description = "Spending forecasts and anomaly detection")
public class InsightResource {

    @EJB private InsightService insightService;
    @EJB private JwtService jwtService;
    @Context private HttpHeaders httpHeaders;

    @GET
    @Path("forecast")
    @Operation(summary = "Get spending forecast and anomaly alerts for the current user")
    public Response getForecast() {
        // Validate JWT — will throw NotAuthorizedException if invalid
        String auth = httpHeaders.getHeaderString("Authorization");
        if (auth == null || !auth.startsWith("Bearer "))
            return Response.status(401).entity("{\"message\":\"Bearer token required\"}").build();

        Claims claims = jwtService.parseToken(auth.substring(7))
                .orElse(null);
        if (claims == null)
            return Response.status(401).entity("{\"message\":\"Invalid or expired token\"}").build();

        String json = insightService.getForecast(auth);
        return Response.ok(json).build();
    }
}
