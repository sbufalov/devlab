# =============================================================================
# UNIFIED MCP HUB - HIGH PERFORMANCE DEV RUNTIME (LLVM + Python + Node.js)
# =============================================================================
FROM node:20-slim

# Set non-interactive frontend installation constraints
ENV DEBIAN_FRONTEND=noninteractive

# Install LLVM toolset, Clang compiler, Python, and base tools inside image layers
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    curl \
    # Install Python toolset
    python3 \
    python3-pip \
    python3-dev \
    # Install LLVM / Clang compilation toolkit (efficient alternative to g++)
    clang \
    llvm \
    cmake \
    make \
    && rm -rf /var/lib/apt/lists/*

# Dynamically pull and install the native Docker CLI (Client only, no Daemon)
# This allows the AI agent to interact with your host containers via mapped socket
RUN curl -fsSL https://get.docker.com | sh && \
    rm -rf /var/lib/apt/lists/*

# Define workspace boundaries
WORKDIR /app

# Pre-install the core Model Context Protocol inspector utility so it is cached
RUN npm install -g @modelcontextprotocol/inspector@0.1.0

# Expose the single unified SSE network port for AI clients (Cursor/Claude)
EXPOSE 3010
