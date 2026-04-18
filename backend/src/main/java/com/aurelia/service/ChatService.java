package com.aurelia.service;

import com.aurelia.dto.ChatMessageDTO;
import com.aurelia.dto.ChatSessionDTO;
import com.aurelia.model.ChatMessage;
import com.aurelia.model.ChatSession;
import com.aurelia.model.User;
import com.aurelia.repository.ChatRepository;
import com.aurelia.repository.UserRepository;
import jakarta.ejb.EJB;
import jakarta.ejb.Stateless;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Stateless
public class ChatService {

    private static final String AI_SERVICE_URL =
            System.getenv().getOrDefault("AI_SERVICE_URL", "http://localhost:8000");

    @EJB private ChatRepository chatRepository;
    @EJB private UserRepository userRepository;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

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

    public ChatMessageDTO sendMessage(UUID userId, UUID sessionId, String content) {
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
            String body = String.format(
                    "{\"session_id\":\"%s\",\"user_id\":\"%s\",\"content\":\"%s\"}",
                    sessionId, userId, content.replace("\"", "\\\""));

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(AI_SERVICE_URL + "/chat/" + sessionId))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .timeout(Duration.ofSeconds(60))
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                aiContent = extractJsonField(resp.body(), "content");
                sources = extractJsonField(resp.body(), "sources");
            } else {
                aiContent = "I'm having trouble connecting to the AI service right now. Please try again.";
            }
        } catch (Exception e) {
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

    /** Minimal JSON field extractor — no extra deps needed. */
    private String extractJsonField(String json, String field) {
        String key = "\"" + field + "\":\"";
        int start = json.indexOf(key);
        if (start < 0) return null;
        start += key.length();
        int end = json.indexOf("\"", start);
        return end > start ? json.substring(start, end) : null;
    }
}
