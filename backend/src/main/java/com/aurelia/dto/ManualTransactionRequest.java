package com.aurelia.dto;

import java.math.BigDecimal;

public class ManualTransactionRequest {
    public String txnDate;
    public String description;
    public String merchant;
    public Integer categoryId;
    public BigDecimal amount;
}
