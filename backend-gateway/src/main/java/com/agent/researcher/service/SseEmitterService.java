package com.agent.researcher.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@SuppressWarnings("null")
public class SseEmitterService {


    private final Map<String, List<SseEmitter>> topicEmitters = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SseEmitter createEmitter(String topic) {
        if (topic == null || topic.isBlank()) {
            return null;
        }
        String normalizedTopic = topic.trim().toLowerCase();
        SseEmitter emitter = new SseEmitter(180_000L); // 3-minute timeout

        topicEmitters.computeIfAbsent(normalizedTopic, k -> new ArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(normalizedTopic, emitter));
        emitter.onTimeout(() -> removeEmitter(normalizedTopic, emitter));
        emitter.onError(e -> removeEmitter(normalizedTopic, emitter));

        log.info("Registered SSE emitter for topic: {}", normalizedTopic);
        return emitter;
    }

    public void handleRedisMessage(String messageBody) {
        try {
            JsonNode jsonNode = objectMapper.readTree(messageBody);
            String topic = jsonNode.has("topic") ? jsonNode.get("topic").asText() : "";
            if (topic.isBlank()) {
                return;
            }
            String normalizedTopic = topic.trim().toLowerCase();
            List<SseEmitter> emitters = topicEmitters.get(normalizedTopic);

            if (emitters != null && !emitters.isEmpty()) {
                List<SseEmitter> deadEmitters = new ArrayList<>();
                for (SseEmitter emitter : new ArrayList<>(emitters)) {
                    try {
                        emitter.send(SseEmitter.event()
                                .name("agent-event")
                                .data(messageBody));
                    } catch (IOException e) {
                        deadEmitters.add(emitter);
                    }
                }
                emitters.removeAll(deadEmitters);
            }
        } catch (Exception e) {
            log.error("Error processing Redis message in SSE emitter service: {}", e.getMessage());
        }
    }

    private void removeEmitter(String topic, SseEmitter emitter) {
        List<SseEmitter> list = topicEmitters.get(topic);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                topicEmitters.remove(topic);
            }
        }
    }
}
