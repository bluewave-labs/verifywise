import os
import dotenv
dotenv.load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.bias_and_fairness import router as bias_and_fairness

app = FastAPI()

# enable CORS
origins = [os.environ.get("BACKEND_URL")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to the Bias and Fairness Server!"}

app.include_router(bias_and_fairness, prefix="/bias_and_fairness", tags=["Bias and Fairness"])
