import uvicorn 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request

from dotenv import load_dotenv
import os 
import logging
import sys


from app.routes import user_router, folder_router, auth_router, content_router, setting_router, tag_router

# Load environment variables from a .env file
load_dotenv()


app = FastAPI()

logger = logging.getLogger(__name__)

# StreamHandler
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger.info('API is starting up')


# Update CORS origins
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(user_router)
app.include_router(folder_router)
app.include_router(auth_router)
app.include_router(content_router)
app.include_router(setting_router)
app.include_router(tag_router)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code} for {request.method} {request.url.path}")
    return response

@app.get("/health")
def status():
    return {'status' : 'alive', 'message': f"running on port {os.environ.get("PORT", 8000)}"}


logger.info('API has started up')
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.api.main:app", host="0.0.0.0", port=port)



