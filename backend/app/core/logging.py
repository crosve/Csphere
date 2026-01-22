import logging 

def setup_logging():
    logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
    
logger = logging.getLogger(__name__)
