FROM python:3.10-slim

# Install dependencies and build tools
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    python3-dev \
    default-libmysqlclient-dev \
    libpq-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# Set the working directory in the container
WORKDIR /app


# Clone the "frontend" directory from your GitHub repositorydd the SSH public keys of the Git server to the known hosts (here, github.com)
RUN mkdir -p -m 0700 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts


# bust the cache everytime
COPY timedatenow.txt /etc/

#Clone the repository, notice the "--mount=type=ssh" option, which allow this instruction to use SSH forwarding
RUN --mount=type=ssh git clone 'git@github.com:crosve/Csphere.git' /app

WORKDIR /app/user-embedding-worker

# Install dependencies from pyproject.toml
RUN uv sync --no-dev
# RUN pip install -r requirements.txt
# RUN sed -i -e "s;localhost;127.0.0.1;g" /app/GenZ-backend/server.py


ENV OPENAI_API_KEY=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
ENV DATABASE_URL=postgresql://uag56q02sraqvf:p6cf033294c0fc829d1de0bd4c07966220b4ee032aad28016c235db4956a5c67b@cd7f19r8oktbkp.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/dd3qv54ubqf1hu
ENV OPENROUTER_API_KEY=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

ENV ACTIVEMQ_QUEUE=CSPHEREQUEUE

ENV ACTIVEMQ_URL=http://feeltiptop.com:8161/ 
ENV ACTIVEMQ_USER=admin
ENV ACTIVEMQ_PASS=tiptop

# Run the application
CMD uv run python main.py