package com.aurelia.resource;

import com.aurelia.dto.ApiError;
import com.aurelia.dto.DocumentDTO;
import com.aurelia.service.DocumentService;
import com.aurelia.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.ejb.EJB;
import jakarta.ws.rs.*;
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
    @EJB private JwtService jwtService;

    @Context
    private HttpHeaders httpHeaders;

    @POST
    @Path("upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Operation(summary = "Upload a PDF or CSV document")
    public Response upload(List<EntityPart> parts) {
        UUID userId = currentUser();
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
                    Math.max(fileSize, 0), filePart.getContent(),
                    httpHeaders.getHeaderString("Authorization"));
            return Response.status(201).entity(dto).build();
        } catch (IllegalArgumentException e) {
            return Response.status(400).entity(ApiError.of(e.getMessage())).build();
        } catch (Exception e) {
            return Response.status(500).entity(ApiError.of("Upload failed: " + e.getMessage())).build();
        }
    }

    @GET
    @Operation(summary = "List documents for the current user")
    public Response list() {
        List<DocumentDTO> docs = documentService.listByUser(currentUser());
        return Response.ok(docs).build();
    }

    @DELETE
    @Path("{id}")
    @Operation(summary = "Delete a document")
    public Response delete(@PathParam("id") UUID id) {
        try {
            documentService.delete(currentUser(), id);
            return Response.noContent().build();
        } catch (IllegalArgumentException e) {
            return Response.status(404).entity(ApiError.of(e.getMessage())).build();
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
