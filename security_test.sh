#!/bin/bash

# Security Testing Script for Minimal Browser
# This script tests various security features and vulnerabilities

set -e

echo "🔒 Security Testing for Minimal Browser"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
log_pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((FAILED++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
    ((WARNINGS++))
}

log_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

# Test 1: Check if dangerous protocols are blocked
test_protocol_blocking() {
    echo -e "\n${BLUE}Testing Protocol Blocking...${NC}"
    
    # Test dangerous protocols
    local dangerous_protocols=(
        "javascript:alert('test')"
        "data:text/html,<script>alert('xss')</script>"
        "file:///etc/passwd"
        "vbscript:msgbox('test')"
        "about:blank"
    )
    
    for protocol in "${dangerous_protocols[@]}"; do
        if grep -q "Blocked dangerous protocol" <(echo "$protocol" 2>&1); then
            log_pass "Blocked dangerous protocol: $protocol"
        else
            log_warning "Protocol blocking not tested: $protocol"
        fi
    done
}

# Test 2: Check Content Security Policy
test_csp_headers() {
    echo -e "\n${BLUE}Testing Content Security Policy...${NC}"
    
    # Check if CSP is implemented in the code
    if grep -q "Content-Security-Policy" src/main.rs; then
        log_pass "CSP headers are implemented"
    else
        log_fail "CSP headers are not implemented"
    fi
    
    # Check for specific CSP directives
    if grep -q "object-src 'none'" src/main.rs; then
        log_pass "object-src 'none' directive found"
    else
        log_warning "object-src directive not found"
    fi
    
    if grep -q "frame-src 'none'" src/main.rs; then
        log_pass "frame-src 'none' directive found"
    else
        log_warning "frame-src directive not found"
    fi
}

# Test 3: Check XSS Prevention
test_xss_prevention() {
    echo -e "\n${BLUE}Testing XSS Prevention...${NC}"
    
    # Check for innerHTML usage
    local innerhtml_count=$(grep -c "innerHTML" src/ui.js || echo "0")
    if [ "$innerhtml_count" -eq 0 ]; then
        log_pass "No innerHTML usage found"
    else
        log_warning "Found $innerhtml_count innerHTML usages - potential XSS risk"
    fi
    
    # Check for textContent usage
    local textcontent_count=$(grep -c "textContent" src/ui.js || echo "0")
    if [ "$textcontent_count" -gt 0 ]; then
        log_pass "textContent is used for safe content insertion"
    else
        log_warning "textContent usage not found"
    fi
}

# Test 4: Check Input Validation
test_input_validation() {
    echo -e "\n${BLUE}Testing Input Validation...${NC}"
    
    # Check for input validation functions
    if grep -q "sanitizeUrl\|sanitizeHtml" src/ui.js; then
        log_pass "Input sanitization functions found"
    else
        log_fail "Input sanitization functions not found"
    fi
    
    # Check for length limits
    if grep -q "length < 2048\|length < 500" src/ui.js; then
        log_pass "Input length limits implemented"
    else
        log_warning "Input length limits not found"
    fi
}

# Test 5: Check IPC Security
test_ipc_security() {
    echo -e "\n${BLUE}Testing IPC Security...${NC}"
    
    # Check for command validation
    if grep -q "validate_ipc_command" src/main.rs; then
        log_pass "IPC command validation implemented"
    else
        log_fail "IPC command validation not implemented"
    fi
    
    # Check for size limits
    if grep -q "1024 \* 1024" src/main.rs; then
        log_pass "IPC request size limits implemented"
    else
        log_warning "IPC request size limits not found"
    fi
    
    # Check for command whitelisting
    if grep -q "tabs_save\|tabs_load" src/main.rs; then
        log_pass "IPC command whitelisting found"
    else
        log_warning "IPC command whitelisting not found"
    fi
}

# Test 6: Check Security Headers
test_security_headers() {
    echo -e "\n${BLUE}Testing Security Headers...${NC}"
    
    local headers=(
        "X-Content-Type-Options"
        "X-Frame-Options"
        "X-XSS-Protection"
    )
    
    for header in "${headers[@]}"; do
        if grep -q "$header" src/main.rs; then
            log_pass "$header header implemented"
        else
            log_warning "$header header not found"
        fi
    done
}

# Test 7: Check Dependencies
test_dependencies() {
    echo -e "\n${BLUE}Testing Dependencies...${NC}"
    
    # Check for security-focused dependencies
    if grep -q "url = \"2.4\"" Cargo.toml; then
        log_pass "URL validation crate included"
    else
        log_warning "URL validation crate not found"
    fi
    
    if grep -q "regex = \"1.10\"" Cargo.toml; then
        log_pass "Regex validation crate included"
    else
        log_warning "Regex validation crate not found"
    fi
    
    # Check for security-focused build profile
    if grep -q "panic = \"abort\"" Cargo.toml; then
        log_pass "Security-focused build profile configured"
    else
        log_warning "Security-focused build profile not found"
    fi
}

# Test 8: Check Code Quality
test_code_quality() {
    echo -e "\n${BLUE}Testing Code Quality...${NC}"
    
    # Check for unsafe blocks
    local unsafe_count=$(grep -c "unsafe" src/*.rs || echo "0")
    if [ "$unsafe_count" -eq 0 ]; then
        log_pass "No unsafe blocks found"
    else
        log_warning "Found $unsafe_count unsafe blocks"
    fi
    
    # Check for error handling
    if grep -q "Result<" src/main.rs; then
        log_pass "Proper error handling with Result types"
    else
        log_warning "Error handling could be improved"
    fi
}

# Test 9: Check Documentation
test_documentation() {
    echo -e "\n${BLUE}Testing Documentation...${NC}"
    
    # Check for security documentation
    if [ -f "SECURITY.md" ]; then
        log_pass "Security documentation exists"
    else
        log_fail "Security documentation missing"
    fi
    
    if [ -f "README.md" ]; then
        log_pass "README with security information exists"
    else
        log_fail "README missing"
    fi
    
    # Check for security comments in code
    local security_comments=$(grep -c "Security:" src/*.rs src/*.js || echo "0")
    if [ "$security_comments" -gt 0 ]; then
        log_pass "Security comments found in code"
    else
        log_warning "Security comments could be added"
    fi
}

# Test 10: Check Build Security
test_build_security() {
    echo -e "\n${BLUE}Testing Build Security...${NC}"
    
    # Try to build the project
    if cargo check --quiet 2>/dev/null; then
        log_pass "Project compiles successfully"
    else
        log_fail "Project has compilation errors"
        return
    fi
    
    # Check for security lints
    if cargo clippy --quiet -- -D warnings 2>/dev/null; then
        log_pass "No clippy warnings found"
    else
        log_warning "Clippy warnings found - run 'cargo clippy' for details"
    fi
}

# Run all tests
run_all_tests() {
    test_protocol_blocking
    test_csp_headers
    test_xss_prevention
    test_input_validation
    test_ipc_security
    test_security_headers
    test_dependencies
    test_code_quality
    test_documentation
    test_build_security
}

# Main execution
main() {
    echo "Starting security tests..."
    echo "=========================="
    
    run_all_tests
    
    echo -e "\n${BLUE}Test Summary${NC}"
    echo "============="
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
    
    # Calculate score
    local total=$((PASSED + FAILED + WARNINGS))
    local score=0
    if [ $total -gt 0 ]; then
        score=$((PASSED * 100 / total))
    fi
    
    echo -e "\n${BLUE}Security Score: ${score}%${NC}"
    
    # Recommendations
    if [ $FAILED -gt 0 ]; then
        echo -e "\n${RED}Critical issues found! Please fix these before deployment.${NC}"
        exit 1
    elif [ $WARNINGS -gt 0 ]; then
        echo -e "\n${YELLOW}Warnings found. Consider addressing these for better security.${NC}"
    else
        echo -e "\n${GREEN}All security tests passed! 🎉${NC}"
    fi
    
    echo -e "\n${BLUE}Security testing complete.${NC}"
}

# Run main function
main "$@"
