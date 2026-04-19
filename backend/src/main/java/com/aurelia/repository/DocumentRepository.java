package com.aurelia.repository;

import com.aurelia.model.Document;
import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Stateless
public class DocumentRepository {

    @PersistenceContext(unitName = "aureliaPU")
    private EntityManager em;

    public Document save(Document document) {
        em.persist(document);
        return document;
    }

    public Document update(Document document) {
        return em.merge(document);
    }

    public Optional<Document> findById(UUID id) {
        return Optional.ofNullable(em.find(Document.class, id));
    }

    public List<Document> findByUserId(UUID userId) {
        return em.createQuery(
                "SELECT d FROM Document d WHERE d.user.id = :userId ORDER BY d.uploadedAt DESC",
                Document.class)
                .setParameter("userId", userId)
                .getResultList();
    }

    public void delete(Document document) {
        em.remove(em.contains(document) ? document : em.merge(document));
    }

    public List<Document> findStuckProcessing(java.time.OffsetDateTime cutoff) {
        return em.createQuery(
                "SELECT d FROM Document d WHERE d.status = 'processing' AND d.uploadedAt < :cutoff",
                Document.class)
                .setParameter("cutoff", cutoff)
                .getResultList();
    }
}
