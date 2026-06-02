# HEDIS Outreach POC - Setup and Run Guide

This document provides a comprehensive guide on how to install, set up, and run the HEDIS Outreach Proof of Concept (POC) project. 

## Project Overview

This project consists of two main parts:
1. **Backend**: A FastAPI application using DuckDB as the database, running on port 8080.
2. **Frontend**: A Next.js application, running on port 3005.

The backend serves APIs for HEDIS outreach data, while the frontend provides the user interface.

## Prerequisites

Before installing the project, make sure you have the following installed on your machine:
- **Python 3.8+** (for the FastAPI backend)
- **Node.js 18+** (for the Next.js frontend)
- **npm** (Node Package Manager)

## Installation Guide

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```cmd
   cd d:\Hedis_outreach_poc\backend
   ```
2. Set up a virtual environment (if not already created):
   ```cmd
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows (CMD/PowerShell)**:
     ```cmd
     .\venv\Scripts\activate
     ```
   - **Mac/Linux**:
     ```bash
     source venv/bin/activate
     ```
4. Install the required Python packages (e.g., FastAPI, Uvicorn, DuckDB). If a `requirements.txt` is present, run:
   ```cmd
   pip install -r requirements.txt
   ```
   *(Note: Ensure you have `fastapi`, `uvicorn`, and `duckdb` installed).*

### 2. Frontend Setup

1. Open a terminal and navigate to the frontend directory:
   ```cmd
   cd d:\Hedis_outreach_poc\frontend
   ```
2. Install the Node.js dependencies:
   ```cmd
   npm install
   ```

---

## How to Run the Project

You can run the entire project (both Frontend and Backend) with a single command using the provided `start.bat` script.

### Running with `start.bat`

1. Open a terminal (Command Prompt or PowerShell) and navigate to the project root:
   ```cmd
   cd d:\Hedis_outreach_poc
   ```
2. Run the batch file:
   ```cmd
   .\start.bat
   ```

**What `start.bat` does:**
- It opens two new command prompt windows.
- In the **first window**, it navigates to the `backend` folder and starts the FastAPI server using `uvicorn` on port 8080.
- In the **second window**, it navigates to the `frontend` folder and starts the Next.js development server using `npm run dev` on port 3005.

### Accessing the Application

- **Frontend UI**: Open your browser and go to [http://localhost:3005](http://localhost:3005)
- **Backend API Docs**: Open your browser and go to [http://localhost:8080/docs](http://localhost:8080/docs) (Swagger UI)

---

## Manual Run Commands (Alternative)

If you prefer to run the servers manually instead of using `start.bat`, follow these steps:

**Start the Backend manually:**
```cmd
cd d:\Hedis_outreach_poc\backend
.\venv\Scripts\activate
uvicorn main:app --port 8080 --reload
```

**Start the Frontend manually:**
```cmd
cd d:\Hedis_outreach_poc\frontend
npm run dev -- -p 3005
```


.\start.bat