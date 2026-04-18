package com.aurelia.dto;

import java.math.BigDecimal;
import java.util.List;

public class TransactionSummaryDTO {
    public BigDecimal totalIncome;
    public BigDecimal totalExpenses;
    public BigDecimal netBalance;
    public List<CategoryTotal> byCategory;

    public static class CategoryTotal {
        public Integer categoryId;
        public String categoryName;
        public String categoryColor;
        public BigDecimal total;
        public long count;

        public CategoryTotal(Integer categoryId, String categoryName,
                             String categoryColor, BigDecimal total, long count) {
            this.categoryId = categoryId;
            this.categoryName = categoryName;
            this.categoryColor = categoryColor;
            this.total = total;
            this.count = count;
        }
    }
}
