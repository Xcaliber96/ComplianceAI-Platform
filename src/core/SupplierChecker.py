import requests

class SupplierExtractor:
    """
    Extracts supplier or partner company names from a document's text using an LLM.
    """

    def __init__(self, llm_api_key: str):
        self.llm_key = llm_api_key
        self.llm_url = "https://api.openai.com/v1/chat/completions"

    def extract_from_document(self, document_text: str):
        """
        Ask the LLM: 'If there are any suppliers in this document, please extract them.'
        Returns the model's response (expected to be a JSON list of supplier names).
        """
        if not document_text.strip():
            return {"error": "Empty document text."}

        prompt = (
            "If there are any suppliers mentioned in this document, "
            "please extract their company names and return them as a JSON list. "
            "If none are found, return an empty list.\n\n"
            f"Document:\n{document_text[:8000]}"
        )

        headers = {
            "Authorization": f"Bearer {self.llm_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "gpt-4-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0
        }

        response = requests.post(self.llm_url, headers=headers, json=payload)
        if response.status_code != 200:
            return {"error": response.text}

        try:
            content = response.json()["choices"][0]["message"]["content"]
            return {"suppliers": content}
        except Exception as e:
            return {"error": str(e)}