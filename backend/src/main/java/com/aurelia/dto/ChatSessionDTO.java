package com.aurelia.dto;

import com.aurelia.model.ChatSession;
import java.util.UUID;

public class ChatSessionDTO {
    public UUID id;
    public String title;
    public String createdAt;
    public String updatedAt;

    public static ChatSessionDTO from(ChatSession s) {
        ChatSessionDTO dto = new ChatSessionDTO();
        dto.id = s.getId();
        dto.title = s.getTitle();
        dto.createdAt = s.getCreatedAt() != null ? s.getCreatedAt().toString() : null;
        dto.updatedAt = s.getUpdatedAt() != null ? s.getUpdatedAt().toString() : null;
        return dto;
    }
}
