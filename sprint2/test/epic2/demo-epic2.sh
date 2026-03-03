#!/bin/bash

# ==========================================================
# 🚗 DriveToSurvive - Epic 2 Presentation Demo Script
# ==========================================================

# Save the current directory
TEST_DIR=$(pwd)

echo "=========================================================="
echo "🌟 Section 1: Data Seeding (Preparing Mock Environment)"
echo "=========================================================="
echo "Running the seed script to prepare Driver, Passenger, Route, and Booking..."
echo ""

# Navigate to server to run the seeding script
cd ../../DriveToSurviveWebApp/server
node scripts/seed-epic2-test.js

echo ""
echo "=========================================================="
echo "🌟 Section 2: Automated Testing (Real-Time UI & API)"
echo "=========================================================="
echo "Robot Framework will now open Google Chrome, login automatically,"
echo "navigate to the /myTrip page, and send realtime GPS updates!"
echo "Please sit back and watch..."
echo ""

# Go back to the test directory
cd "$TEST_DIR"

# Check if .venv exists, else guide user
if [ ! -d ".venv" ]; then
  echo "⚠️ .venv not found. Creating and installing dependencies..."
  python3 -m venv .venv
  source .venv/bin/activate
  pip install robotframework robotframework-seleniumlibrary robotframework-requests robotframework-jsonlibrary
else
  source .venv/bin/activate
fi

# Run the test!
robot --console verbose epic2_arrival_notification.robot

echo ""
echo "=========================================================="
echo "🌟 Section 3: Generating Test Report"
echo "=========================================================="
echo "Opening the detailed HTML test report in your browser..."

# Open report.html in default browser (macOS uses 'open')
sleep 1
open report.html

echo "✨ Presentation Run Complete! ✨"
