import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_market_insight(prompt: str):
    """
    Chat interactively with GPT-4o — not limited to market insights.
    """
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are NOMI, an intelligent compliance and market analysis AI assistant."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.5,
        max_tokens=600,
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    print("NOMI Intelligence Console (type 'exit' to quit)")
    while True:
        user_input = input("\nYou: ")
        if user_input.lower() in ["exit", "quit"]:
            print("👋 Goodbye!")
            break

        reply = generate_market_insight(user_input)
        print(f"NOMI: {reply}")