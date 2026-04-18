package com.aurelia.resource;

import com.aurelia.dto.ApiError;
import com.aurelia.dto.DocumentDTO;
import com.aurelia.service.DocumentService;
import jakarta.ejb.EJB;
import jakarta.ws.rs.*;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.*;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;

@Path("documents")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Documents", description = "Upload and manage financial documents")
public class DocumentResource {

    @EJB private DocumentService documentService;

    @POST
    @Path("upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Operation(summary = "Upload a PDF or CSV document")
    public Response upload(
            @Context ContainerRequestContext ctx,
            List<EntityPart> parts) {

        UUID userId = currentUser(ctx);
        try {
            EntityPart filePart = parts.stream()
                    .filter(p -> "file".equals(p.getName()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Missing 'file' part"));

            String originalName = filePart.getFileName()
                    .orElseThrow(() -> new IllegalArgumentException("Missing filename"));
            String mimeType = filePart.getMediaType().toString().split(";")[0].trim();
            long fileSize = filePart.getHeaders().getFirst("Content-Length") != null
                    ? Long.parseLong(filePart.getHeaders().getFirst("Content-Length")) : -1;

            DocumentDTO dto = documentService.upload(userId, originalName, mimeType,
                    Math.max(fileSize, 0), filePart.getContent());
            return Response.status(201).entity(dto).build();
        } catch (IllegalArgumentException e) {
            return Response.status(400).entity(ApiError.of(e.getMessage())).build();
        } catch (Exception e) {
            return Response.status(500).entity(ApiError.of("Upload failed: " + e.getMessage())).build();
        }
    }

    @GET
    @Operation(summary = "List documents for the current user")
    public Response list(@Context ContainerRequestContext ctx) {
        List<DocumentDTO> docs = documentService.listByUser(currentUser(ctx));
        return Response.ok(docs).build();
    }

    @DELETE
    @Path("{id}")
    @Operation(summary = "Delete a document")
    public Response delete(@Context ContainerRequestContext ctx, @PathParam("id") UUID id) {
        try {
            documentService.delete(currentUser(ctx), id);
            return Response.noContent().build();
        } catch (IllegalArgumentException e) {
            return Response.status(404).entity(ApiError.of(e.getMessage())).build();
        } catch (SecurityException e) {
            return Response.status(403).entity(ApiError.of(e.getMessage())).build();
        }
    }

    private UUID currentUser(ContainerRequestContext ctx) {
        return UUID.fromString((String) ctx.getProperty("userId"));
    }
}
