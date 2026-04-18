package com.aurelia.service;

import com.aurelia.dto.DocumentDTO;
import com.aurelia.model.Document;
import com.aurelia.model.User;
import com.aurelia.repository.DocumentRepository;
import com.aurelia.repository.UserRepository;
import jakarta.ejb.EJB;
import jakarta.ejb.Stateless;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Stateless
public class DocumentService {

    private static final Path UPLOAD_DIR = Paths.get(
            System.getenv().getOrDefault("UPLOAD_DIR", "/tmp/aurelia-uploads"));

    private static final long MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

    @EJB private DocumentRepository documentRepository;
    @EJB private UserRepository userRepository;

    public DocumentDTO upload(UUID userId, String originalName, String mimeType,
                              long fileSize, InputStream stream) throws IOException {
        if (fileSize > MAX_SIZE_BYTES)
            throw new IllegalArgumentException("File exceeds 20 MB limit");

        String allowedType = resolveDocType(mimeType, originalName);
        if (allowedType == null)
            throw new IllegalArgumentException("Only PDF and CSV files are accepted");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        Files.createDirectories(UPLOAD_DIR);
        String storedName = UUID.randomUUID() + "_" + originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path dest = UPLOAD_DIR.resolve(storedName);
        Files.copy(stream, dest, StandardCopyOption.REPLACE_EXISTING);

        Document doc = new Document();
        doc.setUser(user);
        doc.setFilename(storedName);
        doc.setOriginalName(originalName);
        doc.setMimeType(mimeType);
        doc.setFileSize(fileSize);
        doc.setType(allowedType);
        doc.setStatus("pending");
        documentRepository.save(doc);

        // Phase 3: trigger AI parsing here (async call to ai-service /parse)

        return DocumentDTO.from(doc);
    }

    public List<DocumentDTO> listByUser(UUID userId) {
        return documentRepository.findByUserId(userId).stream()
                .map(DocumentDTO::from)
                .collect(Collectors.toList());
    }

    public void delete(UUID userId, UUID docId) {
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        if (!doc.getUser().getId().equals(userId))
            throw new SecurityException("Access denied");

        // Remove stored file
        try {
            Files.deleteIfExists(UPLOAD_DIR.resolve(doc.getFilename()));
        } catch (IOException ignored) { }

        documentRepository.delete(doc);
    }

    private String resolveDocType(String mime, String name) {
        if (mime != null) {
            if (mime.equals("application/pdf")) return "bank_statement";
            if (mime.equals("text/csv") || mime.equals("application/csv")) return "csv";
        }
        String lower = name.toLowerCase();
        if (lower.endsWith(".pdf")) return "bank_statement";
        if (lower.endsWith(".csv")) return "csv";
        return null;
    }
}
