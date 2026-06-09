import subprocess
import os

service_dir = r"c:\Users\facun\Documents\Usagi\LaExtra\python\whatsapp-service"
log_file = r"c:\Users\facun\Documents\Usagi\LaExtra\python\node_error.log"

try:
    # Kill any existing node processes first
    os.system("taskkill /F /IM node.exe")
except Exception:
    pass

try:
    print("Running node index.js...")
    result = subprocess.run(
        ["node", "index.js"],
        cwd=service_dir,
        capture_output=True,
        text=True,
        timeout=10
    )
    with open(log_file, "w", encoding="utf-8") as f:
        f.write("=== STDOUT ===\n")
        f.write(result.stdout)
        f.write("\n=== STDERR ===\n")
        f.write(result.stderr)
    print(f"Log written to {log_file}")
except subprocess.TimeoutExpired as e:
    with open(log_file, "w", encoding="utf-8") as f:
        f.write("=== TIMEOUT STDOUT ===\n")
        f.write(e.stdout or "")
        f.write("\n=== TIMEOUT STDERR ===\n")
        f.write(e.stderr or "")
    print(f"Process timed out. Log written to {log_file}")
except Exception as e:
    with open(log_file, "w", encoding="utf-8") as f:
        f.write(f"Exception: {str(e)}")
    print(f"Failed to run node: {str(e)}")
