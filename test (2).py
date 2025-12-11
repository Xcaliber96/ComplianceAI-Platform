from openai import OpenAI
import os

print("Testing model availability...")
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

try:
    r = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Say hello"}]
    )
    print("SUCCESS:", r.choices[0].message.content)
except Exception as e:
    print("ERROR:", e)
