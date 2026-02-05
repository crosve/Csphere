docker stop csphere-worker-embedder
docker rm csphere-worker-embedder
eval $(ssh-agent)
ssh-add ~/.ssh/id_ed25519_crosve
date > timedatenow.txt
timestamp=$(date +%Y%m%d%H%M%S)

# Build csphere-worker Docker
docker build --ssh default -t csphere-worker-embedder -f Dockerfile-csphere-worker-embedder .
docker tag csphere-worker-embedder:latest csphere-worker-embedder:$timestamp

# Run container
docker run -d --network=host \
  -e OPENROUTER_API_KEY="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" \
  -e OPENAI_API_KEY="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" \
  --name csphere-worker-embedder \
  csphere-worker-embedder 