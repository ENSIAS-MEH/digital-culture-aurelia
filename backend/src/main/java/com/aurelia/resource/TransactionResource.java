package com.aurelia.resource;

import com.aurelia.dto.ApiError;
import com.aurelia.dto.CategoryPatchRequest;
import com.aurelia.dto.TransactionDTO;
import com.aurelia.dto.TransactionSummaryDTO;
import com.aurelia.service.TransactionService;
import jakarta.ejb.EJB;
import jakarta.ws.rs.*;
import jakarta.ws.rs.container.ContainerRequestContext;
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

    @GET
    @Operation(summary = "List transactions with optional filters")
    public Response list(
            @Context ContainerRequestContext ctx,
            @QueryParam("from")       String from,
            @QueryParam("to")         String to,
            @QueryParam("categoryId") Integer categoryId) {

        LocalDate fromDate = from != null ? LocalDate.parse(from) : null;
        LocalDate toDate   = to   != null ? LocalDate.parse(to)   : null;

        List<TransactionDTO> txns = transactionService.list(currentUser(ctx), fromDate, toDate, categoryId);
        return Response.ok(txns).build();
    }

    @GET
    @Path("summary")
    @Operation(summary = "Spending summary grouped by category")
    public Response summary(
            @Context ContainerRequestContext ctx,
            @QueryParam("from") String from,
            @QueryParam("to")   String to) {

        LocalDate fromDate = from != null ? LocalDate.parse(from) : null;
        LocalDate toDate   = to   != null ? LocalDate.parse(to)   : null;

        TransactionSummaryDTO summary = transactionService.summary(currentUser(ctx), fromDate, toDate);
        return Response.ok(summary).build();
    }

    @PATCH
    @Path("{id}/category")
    @Operation(summary = "Assign or change the category of a transaction")
    public Response updateCategory(
            @Context ContainerRequestContext ctx,
            @PathParam("id") UUID id,
            CategoryPatchRequest req) {
        try {
            TransactionDTO updated = transactionService.updateCategory(currentUser(ctx), id, req.categoryId);
            return Response.ok(updated).build();
        } catch (IllegalArgumentException e) {
            return Response.status(400).entity(ApiError.of(e.getMessage())).build();
        } catch (SecurityException e) {
            return Response.status(403).entity(ApiError.of(e.getMessage())).build();
        }
    }

    private UUID currentUser(ContainerRequestContext ctx) {
        return UUID.fromString((String) ctx.getProperty("userId"));
    }
}
