from langgraph.graph import StateGraph, START, END
from app.graph.state import AgentState
from app.agents.nodes import planner_node, researcher_node, writer_node, reviewer_node

def should_continue(state: AgentState) -> str:
    """
    Conditional edge router: If reviewer_feedback contains 'APPROVED' or revision_count >= 2,
    route to END. Otherwise route back to writer.
    """
    feedback = state.get("reviewer_feedback", "")
    revision_count = state.get("revision_count", 0)

    if "APPROVED" in feedback.upper() or revision_count >= 2:
        return END
    return "writer"

workflow = StateGraph(AgentState)

# Add agent nodes
workflow.add_node("planner", planner_node)
workflow.add_node("researcher", researcher_node)
workflow.add_node("writer", writer_node)
workflow.add_node("reviewer", reviewer_node)

# Add linear workflow edges
workflow.add_edge(START, "planner")
workflow.add_edge("planner", "researcher")
workflow.add_edge("researcher", "writer")
workflow.add_edge("writer", "reviewer")

# Add conditional edge from reviewer
workflow.add_conditional_edges(
    "reviewer",
    should_continue,
    {
        END: END,
        "writer": "writer"
    }
)

research_graph = workflow.compile()
