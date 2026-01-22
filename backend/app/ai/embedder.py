import os
from typing import List
from app.core.settings import Settings
from openai import OpenAI


class Embedder:
    def __init__(self, model_name: str = "text-embedding-3-small"):
        self.model = model_name
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def embed(self, text: str) -> List[float]:
        try:
            resp = self.client.embeddings.create(
                model=self.model,
                input=text,
            )
            return resp.data[0].embedding
        except Exception as e:
            print(f"OpenAI embedding failed: {e}")
            return None
