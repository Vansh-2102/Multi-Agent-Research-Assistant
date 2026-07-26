# pyrefly: ignore [missing-import]
from langchain_community.tools import DuckDuckGoSearchRun

def perform_web_search(query: str) -> str:
    """
    Performs a web search using DuckDuckGo and returns a summary string.
    Wraps the call in a try/except block to catch potential rate limits or API errors.
    """
    try:
        search_tool = DuckDuckGoSearchRun()
        results = search_tool.run(query)
        return results
    except Exception as e:
        return f"Search error for query '{query}': {str(e)}"
