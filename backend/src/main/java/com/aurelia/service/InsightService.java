package com.aurelia.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.ejb.Stateless;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.logging.Level;
import java.util.logging.Logger;

@Stateless
public class InsightService {

    private static final Logger LOG = Logger.getLogger(InsightService.class.getName());

    private static final String AI_SERVICE_URL =
            System.getenv().getOrDefault("AI_SERVICE_URL", "http://localhost:8000");

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .version(HttpClient.Version.HTTP_1_1)
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Proxies the forecast + anomaly request to the AI service.
     * Returns the raw JSON string so it can be passed directly to the client.
     */
    public String getForecast(String authToken) {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(AI_SERVICE_URL + "/forecast/"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", authToken != null ? authToken : "")
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() == 200) {
                // Validate it is well-formed JSON before forwarding
                mapper.readTree(resp.body());
                return resp.body();
            }

            LOG.warning("AI service /forecast/ returned HTTP " + resp.statusCode());
            return "{\"forecast_by_category\":[],\"anomalies\":[]}";

        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Failed to fetch forecast from AI service", e);
            return "{\"forecast_by_category\":[],\"anomalies\":[]}";
        }
    }
}
