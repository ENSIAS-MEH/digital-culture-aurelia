package com.aurelia.resource;

import com.aurelia.dto.ApiError;
import com.aurelia.dto.ChatMessageDTO;
import com.aurelia.dto.ChatSessionDTO;
import com.aurelia.dto.SendMessageRequest;
import com.aurelia.service.ChatService;
import jakarta.ejb.EJB;
import jakarta.ws.rs.*;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.*;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;

@Path("chat")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Chat", description = "RAG-powered financial chat")
public class ChatResource {

    @EJB private ChatService chatService;

    @POST
    @Path("sessions")
    @Operation(summary = "Create a new chat session")
    public Response createSession(@Context ContainerRequestContext ctx) {
        ChatSessionDTO session = chatService.createSession(currentUser(ctx));
        return Response.status(201).entity(session).build();
    }

    @GET
    @Path("sessions")
    @Operation(summary = "List all chat sessions for the current user")
    public Response listSessions(@Context ContainerRequestContext ctx) {
        List<ChatSessionDTO> sessions = chatService.listSessions(currentUser(ctx));
        return Response.ok(sessions).build();
    }

    @GET
    @Path("sessions/{sessionId}/messages")
    @Operation(summary = "Get all messages in a session")
    public Response getMessages(
            @Context ContainerRequestContext ctx,
            @PathParam("sessionId") UUID sessionId) {
        try {
            List<ChatMessageDTO> messages = chatService.getMessages(currentUser(ctx), sessionId);
            return Response.ok(messages).build();
        } catch (IllegalArgumentException e) {
            return Response.status(404).entity(ApiError.of(e.getMessage())).build();
        } catch (SecurityException e) {
            return Response.status(403).entity(ApiError.of(e.getMessage())).build();
        }
    }

    @POST
    @Path("sessions/{sessionId}/messages")
    @Operation(summary = "Send a message and receive an AI response")
    public Response sendMessage(
            @Context ContainerRequestContext ctx,
            @PathParam("sessionId") UUID sessionId,
            SendMessageRequest req) {
        try {
            if (req == null || req.content == null || req.content.isBlank())
                return Response.status(400).entity(ApiError.of("Message content is required")).build();

            ChatMessageDTO reply = chatService.sendMessage(currentUser(ctx), sessionId, req.content);
            return Response.ok(reply).build();
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
