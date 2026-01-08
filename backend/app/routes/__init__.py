from app.routes.users import router as user_router
from app.routes.folder import router as folder_router
from app.routes.auth import router as auth_router
from app.routes.content import router as content_router
from app.routes.settings import router as setting_router
from app.routes.tags import router as tag_router


__all__ =[
    user_router,
    folder_router, 
    auth_router,
    content_router, 
    setting_router,
    tag_router,
]