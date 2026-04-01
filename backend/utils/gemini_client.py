import os
import time
import json
import logging
from itertools import cycle
import google.generativeai as genai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("GeminiClient")

# Get up to 3 keys and rotate them to handle 5 RPM Free Tier limit
KEYS = [k for k in [
    os.getenv("GEMINI_KEY_1"),
    os.getenv("GEMINI_KEY_2"),
    os.getenv("GEMINI_KEY_3"),
] if k]

if not KEYS:
    logger.warning("No GEMINI_KEY provided. Agents will fail until .env is configured.")
    key_cycle = cycle(["MOCK_KEY"])
else:
    logger.info(f"Loaded {len(KEYS)} Gemini Keys for Round-Robin rotation.")
    key_cycle = cycle(KEYS)

def get_gemini_client():
    key = next(key_cycle)
    genai.configure(api_key=key)
    return genai.GenerativeModel(
        'gemini-1.5-flash',
        generation_config={"temperature": 0.3, "max_output_tokens": 1000}
    )

def safe_generate(prompt: str, retries: int = 3) -> str:
    """
    Round-robin key selection with strict delay to enforce 5 RPM (1 request / 12s).
    With 3 keys, we actually get ~15 RPM in practice.
    """
    for attempt in range(retries):
        try:
            client = get_gemini_client()
            response = client.generate_content(prompt)
            # Enforce strict 12-second delay to protect the 5 RPM free tier limit
            time.sleep(12)
            return response.text
        except Exception as e:
            if "429" in str(e):
                logger.warning(f"Rate Limit (429) Hit! Exponential backoff attempt {attempt+1}/{retries}")
                time.sleep(15 * (attempt + 1))
            else:
                logger.error(f"Generate error: {str(e)}")
                raise e
    raise Exception("All Gemini keys exhausted or Rate Limit impenetrable.")
