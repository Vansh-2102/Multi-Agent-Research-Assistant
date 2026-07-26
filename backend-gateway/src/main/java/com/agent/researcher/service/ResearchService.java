package com.agent.researcher.service;

import com.agent.researcher.dto.ResearchRequest;
import com.agent.researcher.dto.ResearchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResearchService {

    private final RedisCacheService redisCacheService;
    private final RestTemplate restTemplate;

    @Value("${python.service.url:http://localhost:8000}")
    private String pythonServiceUrl;

    public ResearchResponse processResearch(ResearchRequest request) {
        if (request == null || request.getTopic() == null || request.getTopic().isBlank()) {
            throw new IllegalArgumentException("Topic must not be empty");
        }

        String rawTopic = request.getTopic().trim();
        String normalizedTopic = rawTopic.toLowerCase();

        // 1. Check Redis cache
        String cachedReport = redisCacheService.getCachedReport(normalizedTopic);
        if (cachedReport != null && !cachedReport.isBlank()) {
            log.info("Cache hit for topic: {}", rawTopic);
            return new ResearchResponse(rawTopic, cachedReport);
        }

        // 2. Cache miss -> Call Python AI engine
        log.info("Cache miss for topic: {}. Calling Python AI engine", rawTopic);
        String targetUrl = pythonServiceUrl + "/run-research";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResearchRequest pythonPayload = new ResearchRequest(rawTopic);
        HttpEntity<ResearchRequest> entity = new HttpEntity<>(pythonPayload, headers);

        ResearchResponse pythonResponse = restTemplate.postForObject(targetUrl, entity, ResearchResponse.class);

        if (pythonResponse != null && pythonResponse.getReport() != null) {
            String report = pythonResponse.getReport();
            // Cache result in Redis for 24 hours
            redisCacheService.cacheReport(normalizedTopic, report, 24);
            return new ResearchResponse(rawTopic, report);
        }

        throw new RuntimeException("Failed to receive a valid research report from Python AI engine service");
    }
}
