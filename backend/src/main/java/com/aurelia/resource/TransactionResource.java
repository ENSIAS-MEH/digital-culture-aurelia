package com.aurelia.resource;

import com.aurelia.dto.ApiError;
import com.aurelia.dto.CategoryPatchRequest;
import com.aurelia.dto.TransactionDTO;
import com.aurelia.dto.TransactionSummaryDTO;
import com.aurelia.service.JwtService;
import com.aurelia.service.TransactionService;
import io.jsonwebtoken.Claims;
import jakarta.ejb.EJB;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Path("transactions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Transactions", description = "Browse and categorise transactions")
public class TransactionResource {

    @EJB private TransactionService transactionService;
    @EJB private JwtService jwtService;
    @Context private HttpHeaders httpHeaders;

    @GET
    @Operation(summary = "List transactions with optional filters")
    public Response list(
            @QueryParam("from")       String from,
            @QueryParam("to")         String to,
            @QueryParam("categoryId") Integer categoryId) {

        LocalDate fromDate = from != null ? LocalDate.parse(from) : null;
        LocalDate toDate   = to   != null ? LocalDate.parse(to)   : null;

        List<TransactionDTO> txns = transactionService.list(currentUser(), fromDate, toDate, categoryId);
        return Response.ok(txns).build();
    }

    @GET
    @Path("summary")
    @Operation(summary = "Spending summary grouped by category")
    public Response summary(
            @QueryParam("from") String from,
            @QueryParam("to")   String to) {

        LocalDate fromDate = from != null ? LocalDate.parse(from) : null;
        LocalDate toDate   = to   != null ? LocalDate.parse(to)   : null;

        TransactionSummaryDTO summary = transactionService.summary(currentUser(), fromDate, toDate);
        return Response.ok(summary).build();
    }

    @PATCH
    @Path("{id}/category")
    @Operation(summary = "Assign or change the category of a transaction")
    public Response updateCategory(
            @PathParam("id") UUID id,
            CategoryPatchRequest req) {
        try {
            TransactionDTO updated = transactionService.updateCategory(currentUser(), id, req.categoryId);
            return Response.ok(updated).build();
        } catch (IllegalArgumentException e) {
            return Response.status(400).entity(ApiError.of(e.getMessage())).build();
        } catch (SecurityException e) {
            return Response.status(403).entity(ApiError.of(e.getMessage())).build();
        }
    }

    private UUID currentUser() {
        String auth = httpHeaders.getHeaderString("Authorization");
        if (auth == null || !auth.startsWith("Bearer "))
            throw new NotAuthorizedException("Bearer token required");
        Claims claims = jwtService.parseToken(auth.substring(7))
                .orElseThrow(() -> new NotAuthorizedException("Invalid token"));
        return UUID.fromString(claims.getSubject());
    }
}
