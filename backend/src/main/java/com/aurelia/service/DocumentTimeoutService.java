package com.aurelia.service;

import com.aurelia.model.Document;
import com.aurelia.repository.DocumentRepository;
import jakarta.ejb.EJB;
import jakarta.ejb.Schedule;
import jakarta.ejb.Singleton;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.logging.Logger;

@Singleton
public class DocumentTimeoutService {

    private static final Logger LOG = Logger.getLogger(DocumentTimeoutService.class.getName());
    private static final int TIMEOUT_MINUTES = 15;

    @EJB private DocumentRepository documentRepository;

    @Schedule(minute = "*/15", hour = "*", persistent = false)
    public void markStuckDocumentsFailed() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusMinutes(TIMEOUT_MINUTES);
        List<Document> stuck = documentRepository.findStuckProcessing(cutoff);
        if (stuck.isEmpty()) return;

        LOG.warning("Marking " + stuck.size() + " stuck document(s) as failed (processing > " + TIMEOUT_MINUTES + " min)");
        for (Document doc : stuck) {
            doc.setStatus("failed");
            doc.setErrorMsg("Processing timed out after " + TIMEOUT_MINUTES + " minutes");
            documentRepository.update(doc);
        }
    }
}
