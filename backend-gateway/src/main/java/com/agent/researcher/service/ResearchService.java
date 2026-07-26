package com.agent.researcher.service;

import com.agent.researcher.dto.ResearchRequest;
import com.agent.researcher.dto.ResearchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

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

    public Object uploadDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded document must not be empty");
        }

        String targetUrl = pythonServiceUrl + "/upload-doc";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        try {
            byte[] bytes = file.getBytes();
            ByteArrayResource contentsAsResource = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    String originalName = file.getOriginalFilename();
                    return (originalName != null && !originalName.isBlank()) ? originalName : "uploaded_document";
                }

                @Override
                public long contentLength() {
                    return bytes.length;
                }
            };
            body.add("file", contentsAsResource);
        } catch (IOException e) {
            log.error("Error reading file bytes for document upload", e);
            throw new RuntimeException("Failed to process file upload", e);
        }


        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            return restTemplate.postForObject(targetUrl, requestEntity, Object.class);
        } catch (Exception e) {
            log.error("Failed to forward upload request to Python AI Engine", e);
            throw new RuntimeException("Document upload proxy failed: " + e.getMessage(), e);
        }
    }

    public Object clearDocuments() {
        String targetUrl = pythonServiceUrl + "/clear-docs";
        try {
            restTemplate.delete(targetUrl);
            return java.util.Map.of(
                "status", "success",
                "message", "Successfully cleared all indexed knowledge documents from ChromaDB",
                "indexed_documents", java.util.List.of()
            );
        } catch (Exception e) {
            log.error("Failed to forward clear-docs request to Python AI Engine", e);
            throw new RuntimeException("Clear documents proxy failed: " + e.getMessage(), e);
        }
    }

    public Object getIndexedDocuments() {
        String targetUrl = pythonServiceUrl + "/indexed-docs";
        try {
            return restTemplate.getForObject(targetUrl, Object.class);
        } catch (Exception e) {
            log.error("Failed to fetch indexed documents from Python AI Engine", e);
            return java.util.Map.of("documents", java.util.List.of());
        }
    }
}


