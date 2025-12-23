import os
import sys

def load_api_key():
    key = os.getenv("OPENAI_API_KEY")

    # Diagnostics for debugging
    print("\n=== API KEY LOADER ===")
    print("Loaded key:", key[:10] + "..." if key else None)
    print("Key length:", len(key) if key else 0)
    print("=======================\n")

    # Fail fast if key missing or suspicious
    if not key:
        raise ValueError("OPENAI_API_KEY is missing — backend cannot run.")
    
    # Masked keys always contain **** and are not valid
    if "*" in key:
        raise ValueError(
            "OPENAI_API_KEY appears masked (contains '*'). "
            "Copy the FULL key from OpenAI dashboard."
        )

    # Optional: reject short/truncated keys
    if len(key) < 40:
        raise ValueError(
            f"OPENAI_API_KEY length too short ({len(key)} chars). "
            "You probably copied a masked or truncated key."
        )

    return key

# Allow running as a standalone test
if __name__ == "__main__":
    try:
        load_api_key()
        print("API key looks valid.")
    except Exception as e:
        print("ERROR:", e)
        sys.exit(1)
