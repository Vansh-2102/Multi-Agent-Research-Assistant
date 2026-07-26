package com.agent.researcher.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisCacheService {

    private final StringRedisTemplate redisTemplate;
    private static final String KEY_PREFIX = "research::";

    public String getCachedReport(String topic) {
        if (topic == null || topic.isBlank()) {
            return null;
        }
        String key = KEY_PREFIX + topic.trim().toLowerCase();
        try {
            return redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.error("Redis error while fetching key {}: {}", key, e.getMessage());
            return null;
        }
    }

    public void cacheReport(String topic, String report, long timeoutInHours) {
        if (topic == null || topic.isBlank() || report == null) {
            return;
        }
        String key = KEY_PREFIX + topic.trim().toLowerCase();
        try {
            redisTemplate.opsForValue().set(key, report, timeoutInHours, TimeUnit.HOURS);
            log.info("Successfully cached report for key: {}", key);
        } catch (Exception e) {
            log.error("Redis error while caching key {}: {}", key, e.getMessage());
        }
    }
}
