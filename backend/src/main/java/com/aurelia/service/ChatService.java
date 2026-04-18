package com.aurelia.service;

import com.aurelia.dto.ChatMessageDTO;
import com.aurelia.dto.ChatSessionDTO;
import com.aurelia.model.ChatMessage;
import com.aurelia.model.ChatSession;
import com.aurelia.model.User;
import com.aurelia.repository.ChatRepository;
import com.aurelia.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.ejb.EJB;
import jakarta.ejb.Stateless;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Stateless
public class ChatService {

    private static final Logger LOG = Logger.getLogger(ChatService.class.getName());

    private static final String AI_SERVICE_URL =
            System.getenv().getOrDefault("AI_SERVICE_URL", "http://localhost:8000");

    @EJB private ChatRepository chatRepository;
    @EJB private UserRepository userRepository;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .version(java.net.http.HttpClient.Version.HTTP_1_1)
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    public ChatSessionDTO createSession(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        ChatSession session = new ChatSession();
        session.setUser(user);
        session.setTitle("New conversation");
        chatRepository.saveSession(session);
        return ChatSessionDTO.from(session);
    }

    public List<ChatSessionDTO> listSessions(UUID userId) {
        return chatRepository.findSessionsByUserId(userId).stream()
                .map(ChatSessionDTO::from).collect(Collectors.toList());
    }

    public List<ChatMessageDTO> getMessages(UUID userId, UUID sessionId) {
        ChatSession session = chatRepository.findSessionById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        if (!session.getUser().getId().equals(userId))
            throw new SecurityException("Access denied");

        return chatRepository.findMessagesBySessionId(sessionId).stream()
                .map(ChatMessageDTO::from).collect(Collectors.toList());
    }

    public ChatMessageDTO sendMessage(UUID userId, UUID sessionId, String content, String authToken) {
        ChatSession session = chatRepository.findSessionById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        if (!session.getUser().getId().equals(userId))
            throw new SecurityException("Access denied");

        // Persist user message
        ChatMessage userMsg = new ChatMessage();
        userMsg.setSession(session);
        userMsg.setRole("user");
        userMsg.setContent(content);
        chatRepository.saveMessage(userMsg);

        // Call AI service for RAG response
        String aiContent;
        String sources = null;
        try {
            ObjectNode payload = mapper.createObjectNode();
            payload.put("session_id", sessionId.toString());
            payload.put("user_id", userId.toString());
            payload.put("content", content);
            String body = mapper.writeValueAsString(payload);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(AI_SERVICE_URL + "/chat/" + sessionId))
                    .header("Content-Type", "application/json")
                    .header("Authorization", authToken != null ? authToken : "")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                JsonNode node = mapper.readTree(resp.body());
                aiContent = node.path("content").asText("I couldn't generate a response.");
                JsonNode sourcesNode = node.path("sources");
                sources = sourcesNode.isMissingNode() || sourcesNode.isNull()
                        ? null : mapper.writeValueAsString(sourcesNode);
            } else {
                LOG.warning("AI service returned HTTP " + resp.statusCode() + " for session " + sessionId);
                aiContent = "I'm having trouble connecting to the AI service right now. Please try again.";
            }
        } catch (Exception e) {
            LOG.log(Level.WARNING, "AI service call failed for session " + sessionId, e);
            aiContent = "AI service is unavailable. Please ensure it is running.";
        }

        // Persist assistant message
        ChatMessage assistantMsg = new ChatMessage();
        assistantMsg.setSession(session);
        assistantMsg.setRole("assistant");
        assistantMsg.setContent(aiContent);
        assistantMsg.setSources(sources);
        chatRepository.saveMessage(assistantMsg);

        // Update session title from first user message
        if ("New conversation".equals(session.getTitle())) {
            session.setTitle(content.length() > 60 ? content.substring(0, 57) + "…" : content);
            chatRepository.updateSession(session);
        }

        return ChatMessageDTO.from(assistantMsg);
    }
}
