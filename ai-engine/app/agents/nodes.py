from app.config import llm
from app.graph.state import AgentState
from app.tools.search import perform_web_search
from app.tools.publisher import publish_event

def planner_node(state: AgentState) -> dict:
    """
    Planner agent node: Takes the research topic and generates a 3-point structured outline.
    """
    topic = state.get("topic", "")
    publish_event(topic, "PLANNER", "Planner Agent formulating 3-point research outline...")
    
    prompt = (
        f"You are a research planner. Create a detailed 3-point structured outline "
        f"to research the following topic: '{topic}'.\n"
        f"Format your response cleanly as 3 distinct main outline items."
    )
    response = llm.invoke(prompt)
    plan_content = response.content if isinstance(response.content, str) else str(response.content)
    
    publish_event(topic, "PLANNER_COMPLETE", "Research outline generated successfully.")
    return {"plan": plan_content}


def researcher_node(state: AgentState) -> dict:
    """
    Researcher agent node: Takes the plan, performs web searches using perform_web_search,
    and appends findings to research_data.
    """
    plan = state.get("plan", "")
    topic = state.get("topic", "")
    existing_data = list(state.get("research_data", []))

    publish_event(topic, "RESEARCHER", "Researcher Agent searching DuckDuckGo for live sources...")

    query = f"{topic} research analysis key insights"
    search_result = perform_web_search(query)
    
    existing_data.append(search_result)
    publish_event(topic, "RESEARCHER_COMPLETE", "Web search and data gathering complete.")
    return {"research_data": existing_data}


def writer_node(state: AgentState) -> dict:
    """
    Writer agent node: Compiles research_data and any reviewer_feedback into a markdown draft.
    """
    topic = state.get("topic", "")
    plan = state.get("plan", "")
    research_data = state.get("research_data", [])
    reviewer_feedback = state.get("reviewer_feedback", "")
    revision_count = state.get("revision_count", 0)

    step_name = f"WRITER_PASS_{revision_count + 1}"
    publish_event(topic, "WRITER", f"Writer Agent drafting research report (Pass #{revision_count + 1})...")

    data_summary = "\n---\n".join(research_data) if research_data else "No research data collected."

    prompt = (
        f"You are a scientific and technical research writer. Write a comprehensive, clear, markdown-formatted "
        f"research draft on the topic: '{topic}'.\n\n"
        f"Research Plan:\n{plan}\n\n"
        f"Research Findings:\n{data_summary}\n\n"
    )
    if reviewer_feedback:
        prompt += f"Previous Reviewer Feedback to address:\n{reviewer_feedback}\n\n"

    prompt += "Please output the complete, well-formatted markdown draft."
    response = llm.invoke(prompt)
    draft_content = response.content if isinstance(response.content, str) else str(response.content)
    
    publish_event(topic, "WRITER_COMPLETE", "Research draft completed.")
    return {"draft": draft_content}


def reviewer_node(state: AgentState) -> dict:
    """
    Reviewer agent node: Inspects draft. If high quality, outputs 'APPROVED'.
    Otherwise, provides constructive suggestions saved under reviewer_feedback and increments revision_count.
    """
    draft = state.get("draft", "")
    topic = state.get("topic", "")
    current_revisions = state.get("revision_count", 0)

    publish_event(topic, "REVIEWER", "Reviewer Agent evaluating draft quality and structure...")

    prompt = (
        f"You are an expert peer reviewer. Evaluate the following research draft on '{topic}':\n\n"
        f"{draft}\n\n"
        f"If the draft meets high quality standards, reply strictly with 'APPROVED'. "
        f"Otherwise, provide constructive suggestions for improvement."
    )
    response = llm.invoke(prompt)
    feedback = response.content if isinstance(response.content, str) else str(response.content)

    new_revision_count = current_revisions + 1
    
    result = {
        "reviewer_feedback": feedback,
        "revision_count": new_revision_count
    }

    if "APPROVED" in feedback.upper() or new_revision_count >= 2:
        result["final_report"] = draft
        publish_event(topic, "APPROVED", "Research report approved by Peer Reviewer!")
    else:
        publish_event(topic, "REVISION_REQUESTED", "Reviewer requested revision pass...")

    return result
