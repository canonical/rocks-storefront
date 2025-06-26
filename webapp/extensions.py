from flask_wtf.csrf import CSRFProtect
from flask_caching import Cache


cache = Cache(config={"CACHE_TYPE": "simple"})
csrf = CSRFProtect()
