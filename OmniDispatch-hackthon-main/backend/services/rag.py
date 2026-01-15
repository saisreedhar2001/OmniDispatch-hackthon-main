"""
RAG Knowledge Base Integration
==============================
ChromaDB for historical incidents and safety protocols (Local Storage)
"""

import os
from typing import List, Dict
import chromadb
from chromadb.config import Settings

class EmergencyKnowledgeBase:
    """
    RAG system for emergency dispatch knowledge using ChromaDB
    """
    
    def __init__(self):
        # Initialize ChromaDB with persistent storage
        persist_dir = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db")
        self.client = chromadb.PersistentClient(path=persist_dir)
        
        # Create collections
        self.incidents_collection = self._get_or_create_collection("historical_incidents")
        self.buildings_collection = self._get_or_create_collection("building_blueprints")
        self.protocols_collection = self._get_or_create_collection("safety_protocols")
    
    def _get_or_create_collection(self, name: str):
        """Get or create a ChromaDB collection"""
        try:
            return self.client.get_collection(name)
        except:
            return self.client.create_collection(name)
    
    def add_incident(self, incident_id: str, data: Dict):
        """
        Add a historical incident to the knowledge base
        """
        self.incidents_collection.add(
            ids=[incident_id],
            documents=[str(data)],
            metadatas=[{
                "type": data.get("type", "unknown"),
                "location": data.get("location", ""),
                "date": data.get("date", ""),
                "severity": data.get("severity", "medium")
            }]
        )
    
    def search_similar_incidents(self, query: str, n_results: int = 5) -> List[Dict]:
        """
        Search for similar historical incidents
        """
        results = self.incidents_collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        return [
            {
                "id": results['ids'][0][i],
                "document": results['documents'][0][i],
                "metadata": results['metadatas'][0][i],
                "distance": results['distances'][0][i]
            }
            for i in range(len(results['ids'][0]))
        ]
    
    def add_building(self, building_id: str, data: Dict):
        """
        Add building information and blueprints
        """
        self.buildings_collection.add(
            ids=[building_id],
            documents=[str(data)],
            metadatas=[{
                "address": data.get("address", ""),
                "floors": data.get("floors", 0),
                "type": data.get("type", "residential"),
                "exits": data.get("exits", 0)
            }]
        )
    
    def get_building_info(self, address: str) -> Dict:
        """
        Retrieve building information by address
        """
        results = self.buildings_collection.query(
            query_texts=[address],
            n_results=1
        )
        
        if results['ids'][0]:
            return {
                "id": results['ids'][0][0],
                "data": results['documents'][0][0],
                "metadata": results['metadatas'][0][0]
            }
        return {}
    
    def add_protocol(self, protocol_id: str, data: Dict):
        """
        Add safety protocol document
        """
        self.protocols_collection.add(
            ids=[protocol_id],
            documents=[data.get("content", "")],
            metadatas=[{
                "title": data.get("title", ""),
                "category": data.get("category", ""),
                "version": data.get("version", "1.0"),
                "updated": data.get("updated", "")
            }]
        )
    
    def search_protocols(self, query: str, category: str = None) -> List[Dict]:
        """
        Search safety protocols
        """
        where_filter = {"category": category} if category else None
        
        results = self.protocols_collection.query(
            query_texts=[query],
            n_results=3,
            where=where_filter
        )
        
        return [
            {
                "id": results['ids'][0][i],
                "content": results['documents'][0][i],
                "metadata": results['metadatas'][0][i]
            }
            for i in range(len(results['ids'][0]))
        ]
    
    def seed_sample_data(self):
        """
        Seed the knowledge base with sample data
        """
        # Sample incidents
        incidents = [
            {
                "id": "INC-2025-001",
                "type": "fire",
                "location": "123 Main St",
                "date": "2025-06-15",
                "severity": "high",
                "description": "Structure fire in 5-story building. 2 units responded. No casualties."
            },
            {
                "id": "INC-2025-002",
                "type": "medical",
                "location": "456 Oak Ave",
                "date": "2025-08-22",
                "severity": "critical",
                "description": "Cardiac emergency. Medic 9 responded. Patient stabilized on scene."
            }
        ]
        
        for incident in incidents:
            try:
                self.add_incident(incident["id"], incident)
            except:
                pass
        
        # Sample buildings
        buildings = [
            {
                "id": "BUILD-001",
                "address": "123 Main St",
                "floors": 5,
                "type": "residential",
                "exits": 3,
                "description": "5-story residential building with sprinkler system"
            }
        ]
        
        for building in buildings:
            try:
                self.add_building(building["id"], building)
            except:
                pass
        
        # Sample protocols
        protocols = [
            {
                "id": "PROTO-001",
                "title": "Structure Fire Response Protocol",
                "category": "fire",
                "version": "2026.1",
                "updated": "2025-12-15",
                "content": "Standard operating procedure for structure fires: 1. Ensure scene safety..."
            }
        ]
        
        for protocol in protocols:
            try:
                self.add_protocol(protocol["id"], protocol)
            except:
                pass

# Singleton instance
knowledge_base = EmergencyKnowledgeBase()
