package com.aurelia.repository;

import com.aurelia.model.User;
import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import java.util.Optional;
import java.util.UUID;

@Stateless
public class UserRepository {

    @PersistenceContext(unitName = "aureliaPU")
    private EntityManager em;

    public User save(User user) {
        em.persist(user);
        return user;
    }

    public Optional<User> findByEmail(String email) {
        try {
            return Optional.of(em.createQuery(
                    "SELECT u FROM User u WHERE u.email = :email", User.class)
                    .setParameter("email", email)
                    .getSingleResult());
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    public Optional<User> findById(UUID id) {
        return Optional.ofNullable(em.find(User.class, id));
    }

    public boolean existsByEmail(String email) {
        return (Long) em.createQuery(
                "SELECT COUNT(u) FROM User u WHERE u.email = :email")
                .setParameter("email", email)
                .getSingleResult() > 0;
    }
}
