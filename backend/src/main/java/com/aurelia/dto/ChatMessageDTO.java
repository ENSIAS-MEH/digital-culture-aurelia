package com.aurelia.dto;

import com.aurelia.model.ChatMessage;
import java.time.OffsetDateTime;
import java.util.UUID;

public class ChatMessageDTO {
    public UUID id;
    public String role;
    public String content;
    public String sources;
    public OffsetDateTime createdAt;

    public static ChatMessageDTO from(ChatMessage m) {
        ChatMessageDTO dto = new ChatMessageDTO();
        dto.id = m.getId();
        dto.role = m.getRole();
        dto.content = m.getContent();
        dto.sources = m.getSources();
        dto.createdAt = m.getCreatedAt();
        return dto;
    }
}
