import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

llm = ChatGroq(
    model_name="llama-3.3-70b-versatile",
    temperature=0.2,
    groq_api_key=GROQ_API_KEY or "gsk_placeholder_please_set_groq_api_key"
)
