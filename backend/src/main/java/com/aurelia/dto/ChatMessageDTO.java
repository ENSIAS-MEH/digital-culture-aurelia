package com.aurelia.dto;

import com.aurelia.model.ChatMessage;
import java.util.UUID;

public class ChatMessageDTO {
    public UUID id;
    public String role;
    public String content;
    public String sources;
    public String createdAt;

    public static ChatMessageDTO from(ChatMessage m) {
        ChatMessageDTO dto = new ChatMessageDTO();
        dto.id = m.getId();
        dto.role = m.getRole();
        dto.content = m.getContent();
        dto.sources = m.getSources();
        dto.createdAt = m.getCreatedAt() != null ? m.getCreatedAt().toString() : null;
        return dto;
    }
}
