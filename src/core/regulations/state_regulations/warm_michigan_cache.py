from src.core.regulations.state_regulations.michigan_storage import save_michigan_regulations
import time

if __name__ == "__main__":
    print("🔧 Warming Michigan regulation cache...")

    for attempt in range(3):
        try:
            count = save_michigan_regulations(max_rules=800)
            # print(f"✅ Finished. Saved {count} rules.")
            break
        except Exception as e:
            # print(f"⚠️ Attempt {attempt+1} failed: {e}")
            time.sleep(3)