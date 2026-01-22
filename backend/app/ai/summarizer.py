import os
from openai import OpenAI
from app.core.logging import logger
from app.core.settings import Settings

class Summarizer:
    def __init__(self, model: str = "openrouter/auto:floor", system_prompt: str | None = None):
        self.model = model
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=Settings().OPENROUTER_API_KEY,
        )
        self.system_prompt = system_prompt or (
            "You are a concise technical summarizer. "
            "Summarize the article in exactly two short sentences. "
            "Focus on the main point only."
        )

    def summarize(self, text: str) -> str | None:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": text},
                ],
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            # Preserve behavior: return None on failure
            logger.error(f"OpenRouter summarization failed: {e}")
            return None
