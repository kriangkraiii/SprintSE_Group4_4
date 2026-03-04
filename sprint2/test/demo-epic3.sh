#!/bin/bash

# ==========================================================
# 🚗 DriveToSurvive - Epic 3: Review & Rating Demo Script
# ==========================================================

# Save the current directory
TEST_DIR=$(pwd)

echo "=========================================================="
echo "🌟 Section 1: Restart Server (Reset Rate Limiter)"
echo "=========================================================="
echo "Killing existing Node processes to reset authLimiter..."
echo ""

# Kill node processes to reset rate limiter
pkill -f "node" 2>/dev/null || taskkill /F /FI "IMAGENAME eq node.exe" /T 2>/dev/null
sleep 3
echo "✅ Server stopped."
echo ""

echo "Starting server in background..."
cd ../../DriveToSurviveWebApp
npm run dev &
SERVER_PID=$!
echo "Waiting 20 seconds for server to start..."
sleep 20
echo "✅ Server is running (PID: $SERVER_PID)"
echo ""

# Go back to the test directory
cd "$TEST_DIR"

echo "=========================================================="
echo "🌟 Section 2: Automated API Testing (Robot Framework)"
echo "=========================================================="
echo "Robot Framework will seed test data and run 17 API tests"
echo "covering reviews, disputes, admin management, and validation."
echo "Please sit back and watch..."
echo ""

# Check if .venv exists, else create it
if [ ! -d ".venv" ]; then
  echo "⚠️ .venv not found. Creating and installing dependencies..."
  python3 -m venv .venv
  source .venv/bin/activate
  pip install robotframework robotframework-requests robotframework-seleniumlibrary
else
  source .venv/bin/activate
fi

# Run the API test!
robot --outputdir results --console verbose epic3_review_system.robot

echo ""
echo "=========================================================="
echo "🌟 Section 3: Generating Test Report"
echo "=========================================================="
echo "Opening the detailed HTML test report in your browser..."

# Open report in default browser (cross-platform)
sleep 1
if command -v open &>/dev/null; then
  open results/report.html
elif command -v xdg-open &>/dev/null; then
  xdg-open results/report.html
elif command -v start &>/dev/null; then
  start results/report.html
else
  echo "📄 Report available at: $TEST_DIR/results/report.html"
fi

echo ""
echo "=========================================================="
echo "🌟 Section 4: Browser UI Demo (Selenium)"
echo "=========================================================="
echo "Robot Framework will now open Google Chrome and demonstrate"
echo "the Review & Rating system UI: create review, view reviews,"
echo "driver disputes, and admin dispute management."
echo ""

# Run Selenium browser demo
robot --outputdir results_selenium --console verbose epic3_selenium_demo.robot

echo ""
sleep 1
if command -v open &>/dev/null; then
  open results_selenium/report.html
elif command -v xdg-open &>/dev/null; then
  xdg-open results_selenium/report.html
elif command -v start &>/dev/null; then
  start results_selenium/report.html
else
  echo "📄 Selenium Report at: $TEST_DIR/results_selenium/report.html"
fi

echo ""
echo "✨ Epic 3 Presentation Demo Complete! ✨"
