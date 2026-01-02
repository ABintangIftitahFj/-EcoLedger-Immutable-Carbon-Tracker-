"""
=============================================================================
GENERATIVE AI SERVICE
=============================================================================
Service untuk berinteraksi dengan Google Gemini API.
Digunakan untuk fitur "Eco-Assistant" yang memberikan tips pengurangan emisi.
"""

import os
import logging
import google.generativeai as genai
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Konfigurasi API Key dari environment variable
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class GenAIService:
    def __init__(self):
        if GEMINI_API_KEY:
            genai.configure(api_key=GEMINI_API_KEY)
            # Menggunakan model Gemini Flash yang tersedia
            self.model = genai.GenerativeModel('gemini-flash-latest')
            self.is_configured = True
        else:
            logger.warning("GEMINI_API_KEY not found. AI features will be disabled.")
            self.is_configured = False

    async def generate_carbon_tips(self, activity_summary: str) -> str:
        """
        Produce carbon reduction tips based on user activity.
        
        Args:
            activity_summary: String description of user's recent activities/emissions.
            
        Returns:
            AI generated advice as a string (markdown formatted).
        """
        if not self.is_configured:
            return "AI feature is not configured. Please contact admin to set GEMINI_API_KEY."
        
        try:
            prompt = f"""
            You are Eco-Assistant, a friendly and knowledgeable sustainability expert for the EcoLedger app.
            
            Based on the following user activity summary:
            {activity_summary}
            
            Please provide:
            1. A brief encouraging comment about their tracking habit.
            2. Three (3) specific, actionable, and practical tips to reduce their carbon footprint labeled 'Tips:'.
            3. A short "Did you know?" fact related to their highest emission category if identifiable, or environment in general.
            
            Tone: Motivating, positive, and educational.
            Format: Use Markdown formatting (bolding key terms). Keep the total response under 200 words.
            Language: Indonesian (Bahasa Indonesia).
            """
            
            # Generate content (run in executor to avoid blocking async loop if library is sync)
            # google-generativeai 'generate_content_async' is available in newer versions
            response = await self.model.generate_content_async(prompt)
            
            return response.text
        except Exception as e:
            logger.error(f"Error generating AI tips: {e}")
            return "Maaf, Eco-Assistant sedang istirahat sejenak. Coba lagi nanti! (Error connecting to AI)"

# Global instance
gen_ai_service = GenAIService()
