package com.aurelia.service;

import com.aurelia.model.Transaction;
import com.aurelia.repository.TransactionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.ejb.EJB;
import jakarta.ejb.Stateless;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Stateless
public class InsightService {

    private static final Logger LOG = Logger.getLogger(InsightService.class.getName());

    private static final String AI_SERVICE_URL =
            System.getenv().getOrDefault("AI_SERVICE_URL", "http://localhost:8000");

    @EJB private TransactionRepository transactionRepository;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .version(HttpClient.Version.HTTP_1_1)
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    public String getForecast(String authToken, UUID userId) {
        // Try AI service first
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(AI_SERVICE_URL + "/forecast/"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", authToken != null ? authToken : "")
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                mapper.readTree(resp.body()); // validate JSON
                return resp.body();
            }
        } catch (Exception e) {
            LOG.log(Level.INFO, "AI service unavailable, using local forecast: {0}", e.getMessage());
        }

        return computeLocalForecast(userId);
    }

    private String computeLocalForecast(UUID userId) {
        LocalDate today = LocalDate.now();
        LocalDate sixMonthsAgo = today.minusMonths(6).withDayOfMonth(1);

        List<Transaction> txns = transactionRepository.findByUserIdWithFilters(
                userId, sixMonthsAgo, today, null);

        // Only expense transactions (negative amount)
        List<Transaction> expenses = txns.stream()
                .filter(t -> t.getAmount().compareTo(BigDecimal.ZERO) < 0 && t.getCategory() != null)
                .collect(Collectors.toList());

        // Group by category → month → sum(abs(amount))
        // Map<categoryName, Map<month(yyyy-MM), total>>
        Map<String, TreeMap<String, BigDecimal>> catMonthTotals = new LinkedHashMap<>();

        for (Transaction t : expenses) {
            String cat  = t.getCategory().getName();
            String month = t.getTxnDate().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            catMonthTotals
                    .computeIfAbsent(cat, k -> new TreeMap<>())
                    .merge(month, t.getAmount().abs(), BigDecimal::add);
        }

        // Build forecast_by_category
        List<Map<String, Object>> forecastByCategory = new ArrayList<>();

        for (Map.Entry<String, TreeMap<String, BigDecimal>> entry : catMonthTotals.entrySet()) {
            String catName = entry.getKey();
            TreeMap<String, BigDecimal> monthlyMap = entry.getValue();

            List<Map<String, Object>> monthlyTotals = new ArrayList<>();
            for (Map.Entry<String, BigDecimal> me : monthlyMap.entrySet()) {
                Map<String, Object> mt = new LinkedHashMap<>();
                mt.put("month", me.getKey());
                mt.put("total", me.getValue().setScale(2, RoundingMode.HALF_UP).doubleValue());
                monthlyTotals.add(mt);
            }

            // Forecast = average of last 3 months present
            List<BigDecimal> values = new ArrayList<>(monthlyMap.values());
            int count = Math.min(3, values.size());
            List<BigDecimal> last3 = values.subList(values.size() - count, values.size());
            BigDecimal avg = last3.stream()
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(last3.size()), 2, RoundingMode.HALF_UP);

            Map<String, Object> fc = new LinkedHashMap<>();
            fc.put("category", catName);
            fc.put("monthly_totals", monthlyTotals);
            fc.put("forecast_next_month", avg.doubleValue());
            forecastByCategory.add(fc);
        }

        // Sort by forecast descending
        forecastByCategory.sort((a, b) ->
                Double.compare((Double) b.get("forecast_next_month"),
                               (Double) a.get("forecast_next_month")));

        // Detect anomalies: transactions > 2σ above category mean
        // Group per-category amounts for stats
        Map<String, List<Double>> catAmounts = new HashMap<>();
        for (Transaction t : expenses) {
            String cat = t.getCategory().getName();
            catAmounts.computeIfAbsent(cat, k -> new ArrayList<>())
                    .add(t.getAmount().abs().doubleValue());
        }

        List<Map<String, Object>> anomalies = new ArrayList<>();
        for (Transaction t : expenses) {
            String cat = t.getCategory().getName();
            List<Double> amounts = catAmounts.get(cat);
            if (amounts == null || amounts.size() < 3) continue;

            double mean   = amounts.stream().mapToDouble(d -> d).average().orElse(0);
            double var    = amounts.stream().mapToDouble(d -> (d - mean) * (d - mean)).average().orElse(0);
            double stddev = Math.sqrt(var);
            if (stddev < 0.01) continue;

            double amount    = t.getAmount().abs().doubleValue();
            double deviation = (amount - mean) / stddev;
            if (deviation < 2.0) continue;

            Map<String, Object> anomaly = new LinkedHashMap<>();
            anomaly.put("txn_id",       t.getId().toString());
            anomaly.put("date",         t.getTxnDate().toString());
            anomaly.put("amount",       BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP).doubleValue());
            anomaly.put("description",  t.getDescription());
            anomaly.put("category",     cat);
            anomaly.put("category_mean", BigDecimal.valueOf(mean).setScale(2, RoundingMode.HALF_UP).doubleValue());
            anomaly.put("deviation",    BigDecimal.valueOf(deviation).setScale(2, RoundingMode.HALF_UP).doubleValue());
            anomalies.add(anomaly);
        }

        // Sort anomalies by deviation descending
        anomalies.sort((a, b) ->
                Double.compare((Double) b.get("deviation"), (Double) a.get("deviation")));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("forecast_by_category", forecastByCategory);
        result.put("anomalies", anomalies);

        try {
            return mapper.writeValueAsString(result);
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "Failed to serialize local forecast", e);
            return "{\"forecast_by_category\":[],\"anomalies\":[]}";
        }
    }
}
