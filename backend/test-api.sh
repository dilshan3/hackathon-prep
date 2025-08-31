#!/bin/bash

# Last-Mile Delivery Issue Tracker API Test Script
# This script tests all API endpoints with comprehensive scenarios

# Configuration
API_BASE_URL="${1:-http://localhost:3000}"
echo "🚀 Testing API at: $API_BASE_URL"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print test results
print_test() {
    local test_name="$1"
    local status_code="$2"
    local expected_code="$3"
    
    if [ "$status_code" == "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $test_name (Status: $status_code)"
    else
        echo -e "${RED}❌ FAIL${NC} - $test_name (Expected: $expected_code, Got: $status_code)"
    fi
}

# Function to make API request and extract status code
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local headers="$4"
    
    if [ -n "$data" ] && [ -n "$headers" ]; then
        curl -s -o response.json -w "%{http_code}" -X "$method" "$API_BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "$headers" \
            -d "$data"
    elif [ -n "$data" ]; then
        curl -s -o response.json -w "%{http_code}" -X "$method" "$API_BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data"
    elif [ -n "$headers" ]; then
        curl -s -o response.json -w "%{http_code}" -X "$method" "$API_BASE_URL$endpoint" \
            -H "$headers"
    else
        curl -s -o response.json -w "%{http_code}" -X "$method" "$API_BASE_URL$endpoint"
    fi
}

# Clean up function
cleanup() {
    rm -f response.json
}
trap cleanup EXIT

echo -e "\n${BLUE}📋 1. HEALTH CHECK${NC}"
echo "=================================================="

status_code=$(make_request "GET" "/health")
print_test "Health Check" "$status_code" "200"
if [ "$status_code" == "200" ]; then
    echo "Response: $(cat response.json | jq -r '.status')"
fi

echo -e "\n${BLUE}🔐 2. AUTHENTICATION TESTS${NC}"
echo "=================================================="

# Register Customer
echo -e "\n${YELLOW}Registering Customer...${NC}"
customer_data='{
    "email": "test-customer@example.com",
    "password": "SecurePass123!",
    "name": "Test Customer"
}'

status_code=$(make_request "POST" "/auth/register" "$customer_data")
print_test "Register Customer" "$status_code" "201"

if [ "$status_code" == "201" ]; then
    CUSTOMER_ACCESS_TOKEN=$(cat response.json | jq -r '.tokens.accessToken')
    CUSTOMER_REFRESH_TOKEN=$(cat response.json | jq -r '.tokens.refreshToken')
    CUSTOMER_ID=$(cat response.json | jq -r '.user.id')
    echo "Customer Access Token: ${CUSTOMER_ACCESS_TOKEN:0:20}..."
fi

# Register Support Agent
echo -e "\n${YELLOW}Registering Support Agent...${NC}"
support_data='{
    "email": "test-support@example.com",
    "password": "SecurePass123!",
    "name": "Test Support",
    "role": "SUPPORT"
}'

status_code=$(make_request "POST" "/auth/register" "$support_data")
print_test "Register Support Agent" "$status_code" "201"

if [ "$status_code" == "201" ]; then
    SUPPORT_ACCESS_TOKEN=$(cat response.json | jq -r '.tokens.accessToken')
    SUPPORT_REFRESH_TOKEN=$(cat response.json | jq -r '.tokens.refreshToken')
    echo "Support Access Token: ${SUPPORT_ACCESS_TOKEN:0:20}..."
fi

# Test duplicate registration
echo -e "\n${YELLOW}Testing duplicate registration...${NC}"
status_code=$(make_request "POST" "/auth/register" "$customer_data")
print_test "Duplicate Registration (should fail)" "$status_code" "409"

# Test login
echo -e "\n${YELLOW}Testing login...${NC}"
login_data='{
    "email": "test-customer@example.com",
    "password": "SecurePass123!"
}'

status_code=$(make_request "POST" "/auth/login" "$login_data")
print_test "Customer Login" "$status_code" "200"

# Test invalid login
echo -e "\n${YELLOW}Testing invalid login...${NC}"
invalid_login_data='{
    "email": "test-customer@example.com",
    "password": "WrongPassword"
}'

status_code=$(make_request "POST" "/auth/login" "$invalid_login_data")
print_test "Invalid Login (should fail)" "$status_code" "401"

# Test get profile
echo -e "\n${YELLOW}Testing get profile...${NC}"
status_code=$(make_request "GET" "/auth/me" "" "Authorization: Bearer $CUSTOMER_ACCESS_TOKEN")
print_test "Get Customer Profile" "$status_code" "200"

# Test refresh token
echo -e "\n${YELLOW}Testing token refresh...${NC}"
refresh_data="{\"refreshToken\": \"$CUSTOMER_REFRESH_TOKEN\"}"
status_code=$(make_request "POST" "/auth/refresh" "$refresh_data")
print_test "Refresh Token" "$status_code" "200"

echo -e "\n${BLUE}📝 3. ISSUE MANAGEMENT TESTS${NC}"
echo "=================================================="

# Create issues as customer
echo -e "\n${YELLOW}Creating issues as customer...${NC}"

issue1_data='{
    "orderId": "TEST-ORD-001",
    "type": "LATE",
    "severity": "HIGH",
    "description": "Package was supposed to arrive yesterday but still not delivered. Customer is waiting urgently."
}'

status_code=$(make_request "POST" "/issues" "$issue1_data" "Authorization: Bearer $CUSTOMER_ACCESS_TOKEN")
print_test "Create Issue #1 (LATE/HIGH)" "$status_code" "201"

if [ "$status_code" == "201" ]; then
    ISSUE1_ID=$(cat response.json | jq -r '.issue.id')
    echo "Created Issue ID: $ISSUE1_ID"
fi

issue2_data='{
    "orderId": "TEST-ORD-002",
    "type": "DAMAGED",
    "severity": "MEDIUM",
    "description": "Package arrived with visible damage to the outer box."
}'

status_code=$(make_request "POST" "/issues" "$issue2_data" "Authorization: Bearer $CUSTOMER_ACCESS_TOKEN")
print_test "Create Issue #2 (DAMAGED/MEDIUM)" "$status_code" "201"

if [ "$status_code" == "201" ]; then
    ISSUE2_ID=$(cat response.json | jq -r '.issue.id')
fi

issue3_data='{
    "orderId": "TEST-ORD-003",
    "type": "LOST",
    "severity": "HIGH",
    "description": "Package shows as delivered but customer never received it."
}'

status_code=$(make_request "POST" "/issues" "$issue3_data" "Authorization: Bearer $CUSTOMER_ACCESS_TOKEN")
print_test "Create Issue #3 (LOST/HIGH)" "$status_code" "201"

# Test validation errors
echo -e "\n${YELLOW}Testing validation errors...${NC}"
invalid_issue_data='{
    "orderId": "",
    "type": "INVALID_TYPE",
    "severity": "SUPER_HIGH",
    "description": ""
}'

status_code=$(make_request "POST" "/issues" "$invalid_issue_data" "Authorization: Bearer $CUSTOMER_ACCESS_TOKEN")
print_test "Invalid Issue Data (should fail)" "$status_code" "400"

# Test unauthorized issue creation (no token)
echo -e "\n${YELLOW}Testing unauthorized issue creation...${NC}"
status_code=$(make_request "POST" "/issues" "$issue1_data")
print_test "Unauthorized Issue Creation (should fail)" "$status_code" "401"

# Test support trying to create issue (should fail)
echo -e "\n${YELLOW}Testing support creating issue (should fail)...${NC}"
status_code=$(make_request "POST" "/issues" "$issue1_data" "Authorization: Bearer $SUPPORT_ACCESS_TOKEN")
print_test "Support Creating Issue (should fail)" "$status_code" "403"

# Get customer's own issues
echo -e "\n${YELLOW}Getting customer's issues...${NC}"
status_code=$(make_request "GET" "/issues/my/list" "" "Authorization: Bearer $CUSTOMER_ACCESS_TOKEN")
print_test "Get Customer's Issues" "$status_code" "200"

if [ "$status_code" == "200" ]; then
    issue_count=$(cat response.json | jq '.items | length')
    echo "Customer has $issue_count issues"
fi

# Get specific issue as customer
echo -e "\n${YELLOW}Getting specific issue as customer...${NC}"
if [ -n "$ISSUE1_ID" ]; then
    status_code=$(make_request "GET" "/issues/$ISSUE1_ID" "" "Authorization: Bearer $CUSTOMER_ACCESS_TOKEN")
    print_test "Get Specific Issue (Customer)" "$status_code" "200"
fi

# Test customer accessing another customer's issue (should fail)
# We'll skip this test since we only have one customer

echo -e "\n${BLUE}🔧 4. SUPPORT AGENT TESTS${NC}"
echo "=================================================="

# List all issues as support
echo -e "\n${YELLOW}Listing all issues as support agent...${NC}"
status_code=$(make_request "GET" "/issues" "" "Authorization: Bearer $SUPPORT_ACCESS_TOKEN")
print_test "List All Issues (Support)" "$status_code" "200"

if [ "$status_code" == "200" ]; then
    total_issues=$(cat response.json | jq '.items | length')
    echo "Support can see $total_issues issues"
fi

# List issues with filters
echo -e "\n${YELLOW}Testing issue filters...${NC}"
status_code=$(make_request "GET" "/issues?severity=HIGH&limit=5" "" "Authorization: Bearer $SUPPORT_ACCESS_TOKEN")
print_test "Filter Issues by Severity" "$status_code" "200"

status_code=$(make_request "GET" "/issues?status=OPEN" "" "Authorization: Bearer $SUPPORT_ACCESS_TOKEN")
print_test "Filter Issues by Status" "$status_code" "200"

# Get specific issue as support
echo -e "\n${YELLOW}Getting specific issue as support agent...${NC}"
if [ -n "$ISSUE1_ID" ]; then
    status_code=$(make_request "GET" "/issues/$ISSUE1_ID" "" "Authorization: Bearer $SUPPORT_ACCESS_TOKEN")
    print_test "Get Specific Issue (Support)" "$status_code" "200"
fi

# Update issue status as support
echo -e "\n${YELLOW}Updating issue status as support agent...${NC}"
if [ -n "$ISSUE1_ID" ]; then
    status_update_data='{"status": "IN_PROGRESS"}'
    status_code=$(make_request "PATCH" "/issues/$ISSUE1_ID/status" "$status_update_data" "Authorization: Bearer $SUPPORT_ACCESS_TOKEN")
    print_test "Update Issue Status (Support)" "$status_code" "200"
fi

# Test customer trying to update issue status (should fail)
echo -e "\n${YELLOW}Testing customer updating issue status (should fail)...${NC}"
if [ -n "$ISSUE1_ID" ]; then
    status_update_data='{"status": "RESOLVED"}'
    status_code=$(make_request "PATCH" "/issues/$ISSUE1_ID/status" "$status_update_data" "Authorization: Bearer $CUSTOMER_ACCESS_TOKEN")
    print_test "Customer Update Status (should fail)" "$status_code" "403"
fi

# Test customer trying to list all issues (should fail)
echo -e "\n${YELLOW}Testing customer listing all issues (should fail)...${NC}"
status_code=$(make_request "GET" "/issues" "" "Authorization: Bearer $CUSTOMER_ACCESS_TOKEN")
print_test "Customer List All Issues (should fail)" "$status_code" "403"

echo -e "\n${BLUE}🔄 5. TOKEN MANAGEMENT TESTS${NC}"
echo "=================================================="

# Test logout
echo -e "\n${YELLOW}Testing logout...${NC}"
logout_data="{\"refreshToken\": \"$CUSTOMER_REFRESH_TOKEN\"}"
status_code=$(make_request "POST" "/auth/logout" "$logout_data")
print_test "Logout" "$status_code" "200"

# Test using revoked refresh token (should fail)
echo -e "\n${YELLOW}Testing revoked refresh token (should fail)...${NC}"
status_code=$(make_request "POST" "/auth/refresh" "$logout_data")
print_test "Use Revoked Refresh Token (should fail)" "$status_code" "401"

# Test logout all devices
echo -e "\n${YELLOW}Testing logout from all devices...${NC}"
status_code=$(make_request "POST" "/auth/logout-all" "" "Authorization: Bearer $SUPPORT_ACCESS_TOKEN")
print_test "Logout All Devices" "$status_code" "200"

echo -e "\n${BLUE}❌ 6. ERROR HANDLING TESTS${NC}"
echo "=================================================="

# Test invalid endpoints
echo -e "\n${YELLOW}Testing invalid endpoints...${NC}"
status_code=$(make_request "GET" "/nonexistent-endpoint")
print_test "Invalid Endpoint" "$status_code" "404"

# Test invalid JSON
echo -e "\n${YELLOW}Testing invalid JSON...${NC}"
status_code=$(curl -s -o response.json -w "%{http_code}" -X POST "$API_BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"invalid": json}')
print_test "Invalid JSON" "$status_code" "400"

# Test missing required fields
echo -e "\n${YELLOW}Testing missing required fields...${NC}"
incomplete_data='{"email": "test@example.com"}'
status_code=$(make_request "POST" "/auth/register" "$incomplete_data")
print_test "Missing Required Fields" "$status_code" "400"

echo -e "\n${GREEN}🎉 API TESTING COMPLETE!${NC}"
echo "=================================================="
echo -e "${BLUE}Summary:${NC}"
echo "- All major endpoints tested"
echo "- Authentication and authorization verified"
echo "- Role-based access control validated"
echo "- Input validation confirmed"
echo "- Error handling tested"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review any failed tests above"
echo "2. Test with your frontend application"
echo "3. Run load testing for production readiness"
echo "4. Set up monitoring and logging"

# Clean up
rm -f response.json
