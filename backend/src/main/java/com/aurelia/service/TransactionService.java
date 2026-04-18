package com.aurelia.service;

import com.aurelia.dto.TransactionDTO;
import com.aurelia.dto.TransactionSummaryDTO;
import com.aurelia.model.Category;
import com.aurelia.model.Transaction;
import com.aurelia.repository.TransactionRepository;
import jakarta.ejb.EJB;
import jakarta.ejb.Stateless;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Stateless
public class TransactionService {

    @EJB private TransactionRepository transactionRepository;

    public List<TransactionDTO> list(UUID userId, LocalDate from, LocalDate to, Integer categoryId) {
        return transactionRepository.findByUserIdWithFilters(userId, from, to, categoryId)
                .stream().map(TransactionDTO::from).collect(Collectors.toList());
    }

    public TransactionSummaryDTO summary(UUID userId, LocalDate from, LocalDate to) {
        List<Transaction> all = transactionRepository.findByUserIdWithFilters(userId, from, to, null);

        BigDecimal income = all.stream()
                .filter(t -> t.getAmount().compareTo(BigDecimal.ZERO) > 0)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal expenses = all.stream()
                .filter(t -> t.getAmount().compareTo(BigDecimal.ZERO) < 0)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Object[]> rows = transactionRepository.summaryByCategory(userId, from, to);
        List<TransactionSummaryDTO.CategoryTotal> totals = new ArrayList<>();
        for (Object[] row : rows) {
            Category cat = (Category) row[0];
            if (cat != null) {
                totals.add(new TransactionSummaryDTO.CategoryTotal(
                        cat.getId(), cat.getName(), cat.getColor(),
                        (BigDecimal) row[1], (Long) row[2]));
            }
        }

        TransactionSummaryDTO dto = new TransactionSummaryDTO();
        dto.totalIncome = income;
        dto.totalExpenses = expenses;
        dto.netBalance = income.add(expenses);
        dto.byCategory = totals;
        return dto;
    }

    public TransactionDTO updateCategory(UUID userId, UUID txnId, Integer categoryId) {
        Transaction txn = transactionRepository.findById(txnId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));
        if (!txn.getUser().getId().equals(userId))
            throw new SecurityException("Access denied");

        Category cat = transactionRepository.findCategoryById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + categoryId));

        txn.setCategory(cat);
        txn.setConfirmed(true);
        return TransactionDTO.from(transactionRepository.update(txn));
    }
}
