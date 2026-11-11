"""
FastAPI Application Package

This package contains the core FastAPI application components for the VR therapy
backend, including route definitions, database models, inference orchestration,
and API schemas.

Modules:
- main.py: FastAPI app initialization and route definitions
- inference.py: Orchestrates multimodal AI predictions
- models.py: SQLAlchemy database models for session logging
- schemas.py: Pydantic models for API request/response validation
- database.py: Database connection and session management

Key Features:
- RESTful API design with automatic OpenAPI documentation
- CORS middleware for frontend integration
- Dependency injection for database sessions
- Comprehensive error handling and validation

Impact:
- Provides the API interface for real-time stress inference
- Enables data persistence for therapy session analysis
- Critical for frontend-backend communication in VR therapy
- Foundation for scalable mental health treatment platform
"""