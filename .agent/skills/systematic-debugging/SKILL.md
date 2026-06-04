# Systematic Debugging

## Overview
Random fixes waste time and create new bugs. Quick patches mask underlying issues. 
**Core principle:** ALWAYS find root cause before fixing.

## Instructions
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST

For EACH component boundary:
- Log what data enters component
- Log what data exits component
- Verify environment/config propagation
- Check state at each layer

Run once to gather evidence showing WHERE it breaks.
THEN analyze evidence to identify the failing component.
THEN investigate that specific component.

### Example Tracing
# Layer 1: Workflow
echo "=== Secrets available in workflow: ==="
echo "IDENTITY: ${IDENTITY:+SET}${IDENTITY:-UNSET}"
# Layer 2: Build script
echo "=== Env vars in build script: ==="
env | grep IDENTITY || echo "IDENTITY not in environment"
# Layer 3: Signing script
echo "=== Keychain state: ==="
security list-keychains
security find-identity -v
# Layer 4: Actual signing
codesign --sign "$IDENTITY" --verbose=4 "$APP"
