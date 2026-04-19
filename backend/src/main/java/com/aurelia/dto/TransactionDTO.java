package com.aurelia.dto;

import com.aurelia.model.Transaction;
import java.math.BigDecimal;
import java.util.UUID;

public class TransactionDTO {
    public UUID id;
    public UUID documentId;
    public String txnDate;
    public BigDecimal amount;
    public String description;
    public String merchant;
    public Integer categoryId;
    public String categoryName;
    public String categoryColor;
    public String rawCategory;
    public boolean confirmed;
    public String createdAt;

    public static TransactionDTO from(Transaction t) {
        TransactionDTO dto = new TransactionDTO();
        dto.id = t.getId();
        dto.documentId = t.getDocument() != null ? t.getDocument().getId() : null;
        dto.txnDate = t.getTxnDate() != null ? t.getTxnDate().toString() : null;
        dto.amount = t.getAmount();
        dto.description = t.getDescription();
        dto.merchant = t.getMerchant();
        dto.rawCategory = t.getRawCategory();
        dto.confirmed = t.isConfirmed();
        dto.createdAt = t.getCreatedAt() != null ? t.getCreatedAt().toString() : null;
        if (t.getCategory() != null) {
            dto.categoryId = t.getCategory().getId();
            dto.categoryName = t.getCategory().getName();
            dto.categoryColor = t.getCategory().getColor();
        }
        return dto;
    }
}
