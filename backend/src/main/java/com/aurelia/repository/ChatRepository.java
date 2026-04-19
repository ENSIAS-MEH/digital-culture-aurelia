package com.aurelia.repository;

import com.aurelia.model.ChatMessage;
import com.aurelia.model.ChatSession;
import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Stateless
public class ChatRepository {

    @PersistenceContext(unitName = "aureliaPU")
    private EntityManager em;

    public ChatSession saveSession(ChatSession session) {
        em.persist(session);
        return session;
    }

    public ChatSession updateSession(ChatSession session) {
        return em.merge(session);
    }

    public Optional<ChatSession> findSessionById(UUID id) {
        return Optional.ofNullable(em.find(ChatSession.class, id));
    }

    public List<ChatSession> findSessionsByUserId(UUID userId) {
        return em.createQuery(
                "SELECT s FROM ChatSession s WHERE s.user.id = :userId ORDER BY s.updatedAt DESC",
                ChatSession.class)
                .setParameter("userId", userId)
                .getResultList();
    }

    public ChatMessage saveMessage(ChatMessage message) {
        em.persist(message);
        return message;
    }

    public List<ChatMessage> findMessagesBySessionId(UUID sessionId) {
        return em.createQuery(
                "SELECT m FROM ChatMessage m WHERE m.session.id = :sessionId ORDER BY m.createdAt ASC",
                ChatMessage.class)
                .setParameter("sessionId", sessionId)
                .getResultList();
    }
}
