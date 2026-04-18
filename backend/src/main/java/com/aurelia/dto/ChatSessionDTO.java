package com.aurelia.dto;

import com.aurelia.model.ChatSession;
import java.time.OffsetDateTime;
import java.util.UUID;

public class ChatSessionDTO {
    public UUID id;
    public String title;
    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;

    public static ChatSessionDTO from(ChatSession s) {
        ChatSessionDTO dto = new ChatSessionDTO();
        dto.id = s.getId();
        dto.title = s.getTitle();
        dto.createdAt = s.getCreatedAt();
        dto.updatedAt = s.getUpdatedAt();
        return dto;
    }
}
