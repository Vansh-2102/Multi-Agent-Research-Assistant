package com.agent.researcher.controller;

import com.agent.researcher.dto.ResearchRequest;
import com.agent.researcher.dto.ResearchResponse;
import com.agent.researcher.service.ResearchService;
import com.agent.researcher.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/research")
@RequiredArgsConstructor
public class ResearchController {

    private final ResearchService researchService;
    private final SseEmitterService sseEmitterService;

    @PostMapping
    public ResponseEntity<ResearchResponse> runResearch(@RequestBody ResearchRequest request) {
        ResearchResponse response = researchService.processResearch(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadDocument(@RequestParam("file") MultipartFile file) {
        Object response = researchService.uploadDocument(file);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/clear-docs")
    public ResponseEntity<?> clearDocuments() {
        Object response = researchService.clearDocuments();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/indexed-docs")
    public ResponseEntity<?> getIndexedDocuments() {
        Object response = researchService.getIndexedDocuments();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stream/{topic}")
    public SseEmitter streamProgress(@PathVariable String topic) {
        return sseEmitterService.createEmitter(topic);
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("OK");
    }
}


