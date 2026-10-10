"""
LLM Generation Service for CiteMind using Groq.

This service connects to Groq API to query ultra-fast open-weight models
(e.g., Llama 3.3 70B) with low temperature for factual, grounded answers.
"""

import os
from typing import Optional
from dotenv import load_dotenv

# Load .env file from backend directory if present
load_dotenv()


class LLMService:
    """
    Manages connections and completions with the Groq LLM API.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_model: str = "llama-3.3-70b-versatile"
    ):
        """
        Initializes the Groq client.

        Args:
            api_key: Groq API key. If omitted, read from GROQ_API_KEY environment variable.
            default_model: Default open-weights model to use.
        """
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.default_model = default_model
        self.client = None

        if self.api_key and self.api_key != "your_groq_api_key_here":
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
                print(f"[LLMService] Groq client initialized with model: {self.default_model}")
            except Exception as e:
                print(f"[LLMService] Warning: Failed to initialize Groq client: {e}")
        else:
            print(
                "[LLMService] Notice: No GROQ_API_KEY found. "
                "Running in Mock/Demo mode until an API key is added to .env"
            )

    @property
    def is_configured(self) -> bool:
        """Returns True if a valid Groq client is active."""
        return self.client is not None

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.1,
        model: Optional[str] = None
    ) -> str:
        """
        Generates a completion from the LLM.

        Why low temperature (0.1)?
        In academic RAG, we prioritize factual precision and anti-hallucination.
        A low temperature forces the model to choose high-probability, conservative tokens
        rather than inventing creative deviations.

        Args:
            prompt: The user query + formatted context.
            system_prompt: Instructions defining the model's persona and citation rules.
            temperature: Sampling randomness (0.0 = deterministic, 1.0 = creative).
            model: Model identifier override.

        Returns:
            str: Generated text answer.
        """
        active_model = model or self.default_model

        if not self.is_configured:
            # Helpful fallback for students who haven't pasted their key yet
            return (
                "[!] [CiteMind Mock LLM Response]:\n"
                "To enable real AI answers, please create a free API key at "
                "https://console.groq.com and paste it in `backend/.env` as `GROQ_API_KEY=gsk_...`\n\n"
                f"Generated Prompt would have used model '{active_model}' with temperature {temperature}."
            )

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = self.client.chat.completions.create(
            model=active_model,
            messages=messages,
            temperature=temperature,
            max_tokens=1024
        )

        return response.choices[0].message.content


# ─────────────────────────────────────────────
# Global Service Instance (Lazy Loader)
# ─────────────────────────────────────────────
_llm_instance: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """Provides a shared global instance of LLMService."""
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = LLMService()
    return _llm_instance


if __name__ == "__main__":
    svc = get_llm_service()
    ans = svc.generate(
        prompt="Explain what a process is in 1 sentence.",
        system_prompt="You are a computer science professor."
    )
    print("Response:\n", ans)
