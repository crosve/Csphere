from openai import OpenAI
from app.core.logging import logger
from app.core.settings import get_settings

settings = get_settings()

class OpenRouterBase:
    def __init__(self, model: str = "openrouter/auto:floor", system_prompt: str | None = None):
        '''
            A simple class inetgrated with open router for easy to manage model usage. 
            When initilizing the class make sure you pass in the system prompt. The 
            model is optional. 

            Params:
            model: str - optional
            system_prompt: str -required
        '''
        self.model = model
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
        )
        self.system_prompt = system_prompt 


    def get_response(self, query : str) -> str | None:
        '''
            Method to get a response based on the classes model and system prompt

            Params: 
                query: string - required
        
        '''
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": query},
                ],
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            # Preserve behavior: return None on failure
            logger.error(f"OpenRouter summarization failed: {e}")
            return None
