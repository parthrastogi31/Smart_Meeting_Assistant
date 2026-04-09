import os
from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import List, Optional
import json

# Define the expected structured output from Gemini
class ActionItem(BaseModel):
    assignee: str
    task: str
    deadline: Optional[str] = None

class MeetingResponse(BaseModel):
    executive_summary: str
    context_and_decisions: str
    action_items: List[ActionItem]
    email_draft: str

class AIService:
    def __init__(self):
        # We assume the user has GEMINI_API_KEY set in their environment variables.
        # Alternatively, genai.Client() automatically looks for GEMINI_API_KEY
        # If not set, it may raise an error, but that's expected.
        try:
            self.client = genai.Client(api_key="AIzaSyDhs4fr9GNBxfXNc0hBE7gzUzbkuaC-3cg")
        except Exception as e:
            print(f"Warning: Could not initialize Gemini Client. Ensure GEMINI_API_KEY is set. Error: {e}")
            self.client = None

    def process_transcript(self, transcript: str) -> MeetingResponse:
        if not self.client:
            # Fallback for testing if no key is provided
            return MeetingResponse(
                executive_summary="[Mock] Summary of the meeting.",
                context_and_decisions="[Mock] Decisions made.",
                action_items=[ActionItem(assignee="John", task="[Mock] Fix bugs", deadline="Tomorrow")],
                email_draft="[Mock] Hey all, here is a mock draft."
            )
        
        prompt = f"""
        You are an advanced AI assistant joining an online meeting. 
        Your task is to analyze the following meeting transcript and extract:
        1. An 'executive_summary' (a brief overview of what was discussed).
        2. 'context_and_decisions' (key context and any decisions that were made).
        3. A list of 'action_items', where each item has an 'assignee', 'task', and an optional 'deadline'.
        4. An 'email_draft' suitable for sending to the participants summarizing the meeting and listing their action items.

        Transcript:
        {transcript}
        """

        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=MeetingResponse,
                    temperature=0.2,
                ),
            )
            data = json.loads(response.text)
            return MeetingResponse(**data)
        except Exception as e:
            print(f"Error calling Gemini: {e}")
            # Fallback on error
            return MeetingResponse(
                executive_summary="Error generating summary.",
                context_and_decisions=str(e),
                action_items=[],
                email_draft="Error generating draft."
            )

ai_service = AIService()
