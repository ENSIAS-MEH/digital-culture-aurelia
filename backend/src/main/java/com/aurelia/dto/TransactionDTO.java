package com.aurelia.dto;

import com.aurelia.model.Transaction;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class TransactionDTO {
    public UUID id;
    public UUID documentId;
    public LocalDate txnDate;
    public BigDecimal amount;
    public String description;
    public String merchant;
    public Integer categoryId;
    public String categoryName;
    public String categoryColor;
    public String rawCategory;
    public boolean confirmed;
    public OffsetDateTime createdAt;

    public static TransactionDTO from(Transaction t) {
        TransactionDTO dto = new TransactionDTO();
        dto.id = t.getId();
        dto.documentId = t.getDocument() != null ? t.getDocument().getId() : null;
        dto.txnDate = t.getTxnDate();
        dto.amount = t.getAmount();
        dto.description = t.getDescription();
        dto.merchant = t.getMerchant();
        dto.rawCategory = t.getRawCategory();
        dto.confirmed = t.isConfirmed();
        dto.createdAt = t.getCreatedAt();
        if (t.getCategory() != null) {
            dto.categoryId = t.getCategory().getId();
            dto.categoryName = t.getCategory().getName();
            dto.categoryColor = t.getCategory().getColor();
        }
        return dto;
    }
}
