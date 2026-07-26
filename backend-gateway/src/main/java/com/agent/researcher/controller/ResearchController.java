package com.agent.researcher.controller;

import com.agent.researcher.dto.ResearchRequest;
import com.agent.researcher.dto.ResearchResponse;
import com.agent.researcher.service.ResearchService;
import com.agent.researcher.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
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

    @GetMapping("/stream/{topic}")
    public SseEmitter streamProgress(@PathVariable String topic) {
        return sseEmitterService.createEmitter(topic);
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("OK");
    }
}
