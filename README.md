# AetherAI Web App

AetherAI is a web application designed to boost productivity by refining user queries using the OpenAI API. The app takes an initial query, enhances it for clarity and detail, and then displays a side-by-side comparison of the original and refined responses. A “time saved” metric is also computed based on the differences in response lengths—helping users quickly gauge improvements and efficiency gains.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Development Guidelines](#development-guidelines)
- [License](#license)

## Overview

The AetherAI Web App transforms ordinary queries into enhanced, detailed questions by leveraging OpenAI’s powerful language capabilities. Once a query is refined, the application retrieves and compares responses for both the original and improved versions. Additionally, the app calculates a “time saved” metric based on the difference in response lengths, giving users a clear indication of how much more effective the refined query is.

## Features

- **User-Friendly Interface:**  
  A sleek, interactive web interface that allows users to enter queries and view refined outputs in real time.

- **Query Enhancement:**  
  Utilizes the OpenAI API to automatically add context and detail to user queries, making them more specific and effective.

- **Response Comparison:**  
  Displays side-by-side results for the original and refined queries, helping users quickly see the benefits of query improvement.

- **Efficiency Metric:**  
  Calculates a “time saved” value based on the response length differences, offering a quantitative measure of improved query performance.

- **Interactive Documentation:**  
  The backend is powered by FastAPI, providing automatically generated interactive API documentation accessible via the web interface.

## Project Structure




aetherAI/
├── LICENSE                   # The license file (e.g., MIT) for the project.
├── README.md                 # This file describing the project, setup, and usage.
├── backend/                 # Contains the backend application code.
│   ├── app/                 # The main application package.
│   │   ├── api/             # API endpoint definitions (routes, controllers, etc.).
│   │   ├── core/            # Configuration files and database setup (e.g., config, DB connection).
│   │   ├── models/          # SQLAlchemy models representing your database schema.
│   │   ├── services/        # Business logic and integration with external APIs (like OpenAI).
│   │   ├── main.py          # The entrypoint for the FastAPI application.
│   │   └── __init__.py      # Initializes the Python package.
│   └── requirements.txt     # Lists all the Python dependencies for the backend.
└── venv/                    # The virtual environment directory (should not be tracked in Git).


## Requirements

- **Python 3.12** (or a compatible version)
- Python packages listed in `backend/requirements.txt`, including:
  - FastAPI
  - OpenAI Python SDK
  - uvicorn
  - 

## Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd aetherAI


## Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd aetherAI
2. Set up a virtual environment and activate it:
   python3 -m venv venv
   source venv/bin/activate
3. Install the dependencies:
   pip install -r backend/requirements.txt
Configuration

Create a .env file in the repository root (or within the backend directory) to store sensitive configuration details. For example:

# .env
OPENAI_API_KEY=your_openai_api_key_here
Note: Ensure that your .env file is added to your .gitignore to prevent it from being committed.
Running the Application

From the repository root, start the FastAPI server by running:
Then access the interactive API documentation at http://localhost:8000/docs.
Development Guidelines

Version Control:
Ensure your repository’s .gitignore file (located at the project root) contains the following entries to prevent tracking of virtual environment files and Python cache files:
# Byte-compiled / optimized files
__pycache__/
*.py[cod]
*$py.class

# Virtual environment directory
venv/
.env

Removing Tracked Files:
If files from your virtual environment or __pycache__ directories have been committed accidentally, remove them from version control (without deleting them locally) by running:
git rm -r --cached venv/
find . -type d -name "__pycache__" -exec git rm -r --cached {} \;
git commit -m "Remove virtual environment and cache files from version control"
API Testing:
Utilize FastAPI’s built-in Swagger UI for interactive testing of your endpoints during development.
License

This project is licensed under the MIT License.

