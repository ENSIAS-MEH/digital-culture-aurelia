package com.aurelia.service;

import com.aurelia.dto.DocumentDTO;
import com.aurelia.model.Document;
import com.aurelia.model.User;
import com.aurelia.repository.DocumentRepository;
import com.aurelia.repository.UserRepository;
import jakarta.ejb.Asynchronous;
import jakarta.ejb.EJB;
import jakarta.ejb.Stateless;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Stateless
public class DocumentService {

    private static final Logger LOG = Logger.getLogger(DocumentService.class.getName());

    private static final Path UPLOAD_DIR = Paths.get(
            System.getenv().getOrDefault("UPLOAD_DIR", "/tmp/aurelia-uploads"));

    private static final String AI_SERVICE_URL =
            System.getenv().getOrDefault("AI_SERVICE_URL", "http://localhost:8000");

    private static final long MAX_SIZE_BYTES = 20 * 1024 * 1024;

    @EJB private DocumentRepository documentRepository;
    @EJB private UserRepository userRepository;
    @EJB private DocumentService self; // self-injection for @Asynchronous

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .version(HttpClient.Version.HTTP_1_1)
            .build();

    public DocumentDTO upload(UUID userId, String originalName, String mimeType,
                              long fileSize, InputStream stream, String authToken) throws IOException {
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
        doc.setFileSize(Files.size(dest));
        doc.setType(allowedType);
        doc.setStatus("processing");
        documentRepository.save(doc);

        // Trigger AI parsing asynchronously so the upload response is instant
        self.parseAsync(doc.getId(), originalName, dest, authToken);

        return DocumentDTO.from(doc);
    }

    @Asynchronous
    public void parseAsync(UUID docId, String originalName, Path filePath, String authToken) {
        try {
            byte[] fileBytes = Files.readAllBytes(filePath);
            String boundary = "----AureliaUpload" + System.currentTimeMillis();
            byte[] body = buildMultipart(boundary, docId.toString(), originalName, fileBytes);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(AI_SERVICE_URL + "/parse/"))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .header("Authorization", authToken)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .timeout(Duration.ofSeconds(120))
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                LOG.info("AI parse succeeded for doc " + docId);
            } else {
                LOG.warning("AI parse failed for doc " + docId + ": HTTP " + resp.statusCode() + " — " + resp.body());
                markFailed(docId, "AI service returned HTTP " + resp.statusCode());
            }
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "AI parse error for doc " + docId, e);
            markFailed(docId, e.getClass().getSimpleName() + ": " + e.getMessage());
        }
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
        try {
            Files.deleteIfExists(UPLOAD_DIR.resolve(doc.getFilename()));
        } catch (IOException ignored) { }
        documentRepository.delete(doc);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void markFailed(UUID docId, String reason) {
        try {
            documentRepository.findById(docId).ifPresent(doc -> {
                doc.setStatus("failed");
                doc.setErrorMsg(reason != null ? reason.substring(0, Math.min(reason.length(), 500)) : "Unknown error");
                documentRepository.update(doc);
            });
        } catch (Exception ignored) { }
    }

    private String resolveDocType(String mime, String name) {
        if (mime != null) {
            if (mime.equals("application/pdf")) return "bank_statement";
            if (mime.contains("csv")) return "csv";
        }
        String lower = name.toLowerCase();
        if (lower.endsWith(".pdf")) return "bank_statement";
        if (lower.endsWith(".csv")) return "csv";
        return null;
    }

    private byte[] buildMultipart(String boundary, String docId, String filename, byte[] fileBytes) {
        String CRLF = "\r\n";
        String dash = "--";
        StringBuilder sb = new StringBuilder();

        // doc_id field
        sb.append(dash).append(boundary).append(CRLF);
        sb.append("Content-Disposition: form-data; name=\"doc_id\"").append(CRLF);
        sb.append(CRLF);
        sb.append(docId).append(CRLF);

        // file field header
        sb.append(dash).append(boundary).append(CRLF);
        sb.append("Content-Disposition: form-data; name=\"file\"; filename=\"").append(filename).append("\"").append(CRLF);
        sb.append("Content-Type: application/octet-stream").append(CRLF);
        sb.append(CRLF);

        byte[] headerBytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        String footer = CRLF + dash + boundary + dash + CRLF;
        byte[] footerBytes = footer.getBytes(StandardCharsets.UTF_8);

        byte[] result = new byte[headerBytes.length + fileBytes.length + footerBytes.length];
        System.arraycopy(headerBytes, 0, result, 0, headerBytes.length);
        System.arraycopy(fileBytes, 0, result, headerBytes.length, fileBytes.length);
        System.arraycopy(footerBytes, 0, result, headerBytes.length + fileBytes.length, footerBytes.length);
        return result;
    }
}
