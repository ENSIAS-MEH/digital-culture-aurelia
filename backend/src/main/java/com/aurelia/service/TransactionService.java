package com.aurelia.service;

import com.aurelia.dto.ManualTransactionRequest;
import com.aurelia.dto.TransactionDTO;
import com.aurelia.dto.TransactionSummaryDTO;
import com.aurelia.model.Category;
import com.aurelia.model.Transaction;
import com.aurelia.model.User;
import com.aurelia.repository.TransactionRepository;
import com.aurelia.repository.UserRepository;
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
    @EJB private UserRepository userRepository;

    public TransactionDTO createManual(UUID userId, ManualTransactionRequest req) {
        if (req.description == null || req.description.isBlank())
            throw new IllegalArgumentException("Description is required");
        if (req.amount == null || req.amount.compareTo(BigDecimal.ZERO) == 0)
            throw new IllegalArgumentException("Amount must be non-zero");
        if (req.txnDate == null)
            throw new IllegalArgumentException("Date is required");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Category category = req.categoryId != null
                ? transactionRepository.findCategoryById(req.categoryId).orElse(null)
                : null;

        Transaction txn = new Transaction();
        txn.setUser(user);
        txn.setTxnDate(LocalDate.parse(req.txnDate));
        txn.setDescription(req.description.trim());
        txn.setMerchant(req.merchant != null ? req.merchant.trim() : null);
        txn.setAmount(req.amount); // sign from client: negative=expense, positive=income
        txn.setCategory(category);
        txn.setConfirmed(true);

        return TransactionDTO.from(transactionRepository.save(txn));
    }

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
