#!/bin/bash
# Test script to verify build environment matches CI/CD setup

echo "🔧 AcademicQuest-Fresh Build Environment Test"
echo "=============================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

command_exists node
print_status "Node.js installed" $?

command_exists npm
print_status "npm installed" $?

command_exists cargo
print_status "Rust/Cargo installed" $?

command_exists git
print_status "Git installed" $?

# Check Node.js version
if command_exists node; then
    NODE_VERSION=$(node --version | sed 's/v//')
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        print_status "Node.js version $NODE_VERSION (>= 18)" 0
    else
        print_status "Node.js version $NODE_VERSION (< 18 - please upgrade)" 1
    fi
fi

echo -e "\n${YELLOW}Checking Tauri setup...${NC}"

# Check if Tauri CLI is installed
if command_exists tauri || [ -f "$HOME/.cargo/bin/tauri" ]; then
    # Try to get version, add cargo bin to PATH if needed
    export PATH="$HOME/.cargo/bin:$PATH"
    if command_exists tauri; then
        TAURI_VERSION=$(tauri --version 2>/dev/null)
        if [ $? -eq 0 ]; then
            print_status "Tauri CLI installed: $TAURI_VERSION" 0
        else
            print_status "Tauri CLI found but version check failed" 1
        fi
    else
        print_status "Tauri CLI not found in PATH" 1
    fi
else
    echo -e "${RED}❌ Tauri CLI not installed${NC}"
    echo -e "${YELLOW}💡 To install: cargo install tauri-cli --version ^2.0${NC}"
fi

echo -e "\n${YELLOW}Checking project dependencies...${NC}"

# Check if package.json exists and dependencies are installed
if [ -f "package.json" ]; then
    print_status "Root package.json found" 0
    
    if [ -d "node_modules" ]; then
        print_status "Root node_modules exists" 0
    else
        print_status "Root node_modules missing - run 'npm install'" 1
    fi
else
    print_status "Root package.json not found" 1
fi

# Check web dependencies
if [ -f "web/package.json" ]; then
    print_status "Web package.json found" 0
    
    if [ -d "web/node_modules" ]; then
        print_status "Web node_modules exists" 0
    else
        print_status "Web node_modules missing - run 'cd web && npm install'" 1
    fi
else
    print_status "Web package.json not found" 1
fi

# Check Tauri configuration
if [ -f "src-tauri/tauri.conf.json" ]; then
    print_status "Tauri configuration found" 0
else
    print_status "Tauri configuration missing" 1
fi

echo -e "\n${YELLOW}Testing build commands...${NC}"

# Test if we can run the tauri command
export PATH="$HOME/.cargo/bin:$PATH"
if command_exists tauri; then
    echo "Testing 'tauri info'..."
    tauri info >/dev/null 2>&1
    print_status "Tauri info command works" $?
else
    print_status "Cannot test tauri commands - CLI not installed" 1
fi

echo -e "\n${YELLOW}Platform-specific checks...${NC}"

# Platform-specific dependency checks
case "$(uname -s)" in
    Linux*)
        echo "Detected Linux - checking system dependencies..."
        
        # Check for required libraries
        dpkg -l | grep -q libgtk-3-dev
        print_status "libgtk-3-dev installed" $?
        
        dpkg -l | grep -q "libwebkit2gtk-4\.[01]-dev"
        print_status "libwebkit2gtk development package installed" $?
        ;;
        
    Darwin*)
        echo "Detected macOS - checking Xcode tools..."
        
        if command_exists xcode-select; then
            xcode-select -p >/dev/null 2>&1
            print_status "Xcode Command Line Tools installed" $?
        else
            print_status "Xcode Command Line Tools not found" 1
        fi
        ;;
        
    CYGWIN*|MINGW*|MSYS*)
        echo "Detected Windows environment"
        print_status "Windows environment detected" 0
        ;;
        
    *)
        echo "Unknown platform: $(uname -s)"
        ;;
esac

echo -e "\n${YELLOW}Summary${NC}"
echo "======="
echo "If all checks pass with ✅, your environment should match the CI/CD setup."
echo "If you see ❌, please install the missing dependencies."
echo ""
echo "Quick setup commands:"
echo "- Install Tauri CLI: cargo install tauri-cli --version ^2.0"
echo "- Install deps: npm install && cd web && npm install"
echo "- Run dev server: npm run dev:tauri"
echo "- Build app: npm run build:tauri"
