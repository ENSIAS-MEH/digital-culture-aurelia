package com.aurelia.repository;

import com.aurelia.model.Category;
import com.aurelia.model.Transaction;
import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Stateless
public class TransactionRepository {

    @PersistenceContext(unitName = "aureliaPU")
    private EntityManager em;

    public Transaction save(Transaction transaction) {
        em.persist(transaction);
        return transaction;
    }

    public Transaction update(Transaction transaction) {
        return em.merge(transaction);
    }

    public Optional<Transaction> findById(UUID id) {
        return Optional.ofNullable(em.find(Transaction.class, id));
    }

    public List<Transaction> findByUserIdWithFilters(UUID userId, LocalDate from, LocalDate to, Integer categoryId) {
        String jpql = "SELECT t FROM Transaction t WHERE t.user.id = :userId";
        if (from != null)       jpql += " AND t.txnDate >= :from";
        if (to != null)         jpql += " AND t.txnDate <= :to";
        if (categoryId != null) jpql += " AND t.category.id = :categoryId";
        jpql += " ORDER BY t.txnDate DESC";

        var query = em.createQuery(jpql, Transaction.class).setParameter("userId", userId);
        if (from != null)       query.setParameter("from", from);
        if (to != null)         query.setParameter("to", to);
        if (categoryId != null) query.setParameter("categoryId", categoryId);
        return query.getResultList();
    }

    public List<Object[]> summaryByCategory(UUID userId, LocalDate from, LocalDate to) {
        String jpql = """
                SELECT t.category, SUM(t.amount), COUNT(t)
                FROM Transaction t
                WHERE t.user.id = :userId
                  AND t.amount < 0
                """;
        if (from != null) jpql += " AND t.txnDate >= :from";
        if (to != null)   jpql += " AND t.txnDate <= :to";
        jpql += " GROUP BY t.category ORDER BY SUM(t.amount) ASC";

        var query = em.createQuery(jpql, Object[].class).setParameter("userId", userId);
        if (from != null) query.setParameter("from", from);
        if (to != null)   query.setParameter("to", to);
        return query.getResultList();
    }

    public Optional<Category> findCategoryById(Integer id) {
        return Optional.ofNullable(em.find(Category.class, id));
    }
}
