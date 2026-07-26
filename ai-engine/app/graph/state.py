from typing import TypedDict, List

class AgentState(TypedDict):
    topic: str
    plan: str
    research_data: List[str]
    draft: str
    reviewer_feedback: str
    revision_count: int
    final_report: str
