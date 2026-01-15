"""
Chronos Predictive Intelligence CrewAI Agent System
====================================================
Specialized AI agents for disaster risk analysis and prediction
Uses Groq for ultra-fast inference with dynamic location analysis
"""

from crewai import Agent, Task, Crew, Process, LLM
import os
import json
from typing import Dict, Optional
from datetime import datetime

class ChronosCrew:
    """
    Chronos AI Crew: Three specialized agents for predictive disaster intelligence
    """
    
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key:
            raise ValueError("GROQ_API_KEY not configured")
            
        # Initialize Groq-powered LLM (ultra-fast inference)
        self.llm = LLM(
            model="groq/llama-3.3-70b-versatile",
            api_key=api_key,
            temperature=0.4
        )
        
        # Initialize specialized agents
        self.geospatial_analyst = self._create_geospatial_agent()
        self.historical_researcher = self._create_historical_agent()
        self.risk_predictor = self._create_predictor_agent()
    
    def _create_geospatial_agent(self) -> Agent:
        """Agent 1: Geospatial Analyst - Analyzes location characteristics"""
        return Agent(
            role='Geospatial Risk Analyst',
            goal='Analyze geographical characteristics and identify natural disaster vulnerabilities',
            backstory="""You are a world-class geospatial analyst with expertise in 
            tectonic plates, climate patterns, topography, and geographical risk factors.
            You can identify what types of natural disasters are likely based on 
            coordinates - fault lines, volcanic activity, flood plains, tornado corridors,
            hurricane paths, wildfire zones, etc. You provide detailed explanations
            of WHY a location faces specific risks based on its geography.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )
    
    def _create_historical_agent(self) -> Agent:
        """Agent 2: Historical Disaster Researcher - Studies past incidents"""
        return Agent(
            role='Historical Disaster Pattern Specialist',
            goal='Research and analyze historical disaster data for any location',
            backstory="""You are a disaster historian with comprehensive knowledge of 
            global natural disasters from ancient times to present. You can identify
            patterns in disaster frequency, severity, and seasonality for any region.
            You correlate current conditions with historical precedents and identify
            recurring cycles. You explain how historical patterns predict future risks.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )
    
    def _create_predictor_agent(self) -> Agent:
        """Agent 3: Risk Predictor - Generates risk scores and recommendations"""
        return Agent(
            role='Predictive Risk Assessment Coordinator',
            goal='Generate accurate risk assessments and actionable recommendations',
            backstory="""You are an expert in disaster risk modeling and emergency
            preparedness. You synthesize geospatial analysis and historical data
            to generate precise risk scores with clear explanations. You identify
            specific risk zones, calculate preparedness requirements, and provide
            actionable recommendations. You always explain your reasoning clearly.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=True
        )
    
    def analyze_location(self, lat: float, lng: float, location_name: Optional[str] = None) -> Dict:
        """
        Analyze any location for disaster risk using the Chronos AI crew
        
        Args:
            lat: Latitude
            lng: Longitude  
            location_name: Optional known name of the location
        
        Returns:
            Comprehensive disaster risk analysis
        """
        
        # Task 1: Geospatial Analysis
        geospatial_task = Task(
            description=f"""
            Analyze this location for natural disaster vulnerabilities:
            
            Coordinates: {lat}°N, {lng}°E
            Location: {location_name or "Unknown - determine from coordinates"}
            
            Determine:
            1. What country/region is this? (based on coordinates)
            2. What are the PRIMARY natural disaster risks for this exact location?
            3. Is this location near any tectonic fault lines? Which ones?
            4. What is the climate zone and associated weather risks?
            5. Is this in a flood plain, coastal area, or volcanic region?
            6. What topographical features affect disaster risk?
            
            Provide a detailed geographic risk profile with SPECIFIC reasons.
            Format your response as structured analysis.
            """,
            agent=self.geospatial_analyst,
            expected_output="Detailed geospatial risk analysis with specific reasons"
        )
        
        # Task 2: Historical Pattern Research
        historical_task = Task(
            description=f"""
            Based on the geospatial analysis, research historical disaster patterns:
            
            Coordinates: {lat}°N, {lng}°E
            
            Research:
            1. What major disasters have occurred in this region historically?
            2. What is the frequency of each disaster type? (e.g., "major earthquake every 50-100 years")
            3. What seasonal patterns exist? (e.g., "cyclone season June-November")
            4. Are there any current warning signs or ongoing concerns?
            5. What was the most recent significant disaster and its impact?
            6. Generate 3 specific historical patterns with confidence percentages
            
            For each pattern, explain:
            - What the pattern is
            - How confident we are (percentage)
            - Why this pattern exists (explanation)
            - What action should be taken (recommendation)
            """,
            agent=self.historical_researcher,
            expected_output="Historical disaster patterns with confidence scores",
            context=[geospatial_task]
        )
        
        # Task 3: Risk Assessment & Recommendations
        predictor_task = Task(
            description=f"""
            Using the geospatial and historical analysis, generate a complete risk assessment:
            
            Coordinates: {lat}°N, {lng}°E
            Current Date: {datetime.now().strftime("%Y-%m-%d")}
            
            Generate a PRECISE JSON response with these exact fields:
            
            {{
                "location_identified": "Name of the location/region",
                "country": "Country name",
                "overall_risk_level": "critical|high|medium|low",
                "risk_score": <number 0-100>,
                "risk_score_explanation": "Clear explanation of why this score was given",
                "primary_risks": ["list of main disaster types"],
                "risk_zones": [
                    {{
                        "name": "Zone name",
                        "risk_score": <0-100>,
                        "primary_risk": "Main risk type",
                        "explanation": "Why this is a risk zone"
                    }}
                ],
                "historical_patterns": [
                    {{
                        "pattern": "Pattern name",
                        "confidence": <0-100>,
                        "description": "Detailed explanation",
                        "recommendation": "Action to take"
                    }}
                ],
                "immediate_concerns": ["current active concerns"],
                "prediction_next_24h": "What to expect in next 24 hours",
                "prediction_next_week": "What to expect in next week",
                "preparedness_score": <0-100>,
                "recommended_actions": ["specific actionable recommendations"],
                "ai_reasoning": "Explain your overall analysis process and conclusions"
            }}
            
            Be specific and accurate. Explain your reasoning clearly.
            Respond with ONLY the JSON, no other text.
            """,
            agent=self.risk_predictor,
            expected_output="Complete JSON risk assessment",
            context=[geospatial_task, historical_task]
        )
        
        # Create and run the Chronos crew
        crew = Crew(
            agents=[
                self.geospatial_analyst,
                self.historical_researcher,
                self.risk_predictor
            ],
            tasks=[geospatial_task, historical_task, predictor_task],
            process=Process.sequential,
            verbose=True
        )
        
        # Execute the crew
        result = crew.kickoff()
        
        # Parse the result
        result_str = str(result)
        
        # Try to extract JSON from the result
        try:
            # Find JSON in the response
            if "```json" in result_str:
                json_str = result_str.split("```json")[1].split("```")[0].strip()
            elif "```" in result_str:
                json_str = result_str.split("```")[1].split("```")[0].strip()
            elif "{" in result_str:
                # Find first { and last }
                start = result_str.find("{")
                end = result_str.rfind("}") + 1
                json_str = result_str[start:end]
            else:
                json_str = result_str
                
            analysis = json.loads(json_str)
        except json.JSONDecodeError:
            # Return a structured fallback with the raw analysis
            analysis = {
                "location_identified": "Analysis in progress",
                "overall_risk_level": "medium",
                "risk_score": 50,
                "risk_score_explanation": "Unable to parse structured response",
                "raw_analysis": result_str[:2000],
                "error": "JSON parsing failed"
            }
        
        return {
            "success": True,
            "coordinates": {"lat": lat, "lng": lng},
            "analysis": analysis,
            "agents_executed": ["geospatial_analyst", "historical_researcher", "risk_predictor"],
            "generated_at": datetime.now().isoformat()
        }


# Synchronous wrapper for async contexts
def analyze_location_sync(lat: float, lng: float, location_name: Optional[str] = None) -> Dict:
    """Synchronous wrapper for location analysis"""
    try:
        crew = ChronosCrew()
        return crew.analyze_location(lat, lng, location_name)
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "coordinates": {"lat": lat, "lng": lng}
        }
