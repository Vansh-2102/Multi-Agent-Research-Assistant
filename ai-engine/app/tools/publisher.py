import json
import os
# pyrefly: ignore [missing-import]
import redis

REDIS_URL = os.getenv("REDIS_URL") or os.getenv("SPRING_REDIS_URL")

def get_redis_client():
    try:
        if REDIS_URL:
            return redis.from_url(REDIS_URL, decode_responses=True)
        
        host = os.getenv("SPRING_REDIS_HOST", os.getenv("REDIS_HOST", "localhost"))
        port = int(os.getenv("SPRING_REDIS_PORT", os.getenv("REDIS_PORT", 6379)))
        password = os.getenv("SPRING_REDIS_PASSWORD", os.getenv("REDIS_PASSWORD", None))
        username = os.getenv("SPRING_REDIS_USERNAME", os.getenv("REDIS_USERNAME", "default"))
        ssl = os.getenv("SPRING_REDIS_SSL", "false").lower() in ("true", "1", "yes")
        
        return redis.Redis(
            host=host, 
            port=port, 
            username=username, 
            password=password if password else None, 
            ssl=ssl, 
            db=0, 
            decode_responses=True
        )
    except Exception as e:
        print(f"Failed to connect to Redis: {e}")
        return None

_redis_client = get_redis_client()

def publish_event(topic: str, step: str, message: str):
    """
    Publishes a real-time JSON agent progress event to Redis channel 'research_events'.
    """
    if not topic:
        return
    
    normalized_topic = topic.strip().lower()
    event_payload = json.dumps({
        "topic": normalized_topic,
        "step": step,
        "message": message
    })
    
    try:
        global _redis_client
        if _redis_client is None:
            _redis_client = get_redis_client()
        if _redis_client:
            _redis_client.publish("research_events", event_payload)
    except Exception as e:
        print(f"Error publishing agent progress event to Redis: {e}")

