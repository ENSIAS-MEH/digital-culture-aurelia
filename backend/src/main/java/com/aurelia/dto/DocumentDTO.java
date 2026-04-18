package com.aurelia.dto;

import com.aurelia.model.Document;
import java.util.UUID;

public class DocumentDTO {
    public UUID id;
    public String originalName;
    public String mimeType;
    public Long fileSize;
    public String type;
    public String status;
    public String errorMsg;
    public String uploadedAt;
    public String processedAt;

    public static DocumentDTO from(Document d) {
        DocumentDTO dto = new DocumentDTO();
        dto.id = d.getId();
        dto.originalName = d.getOriginalName();
        dto.mimeType = d.getMimeType();
        dto.fileSize = d.getFileSize();
        dto.type = d.getType();
        dto.status = d.getStatus();
        dto.errorMsg = d.getErrorMsg();
        dto.uploadedAt = d.getUploadedAt() != null ? d.getUploadedAt().toString() : null;
        dto.processedAt = d.getProcessedAt() != null ? d.getProcessedAt().toString() : null;
        return dto;
    }
}
