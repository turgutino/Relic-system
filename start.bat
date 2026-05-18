@echo off
setlocal
cd /d "%~dp0"

echo Starting Neo4j container...
docker start neo4j 2>nul
if errorlevel 1 (
    echo Neo4j container not found, creating...
    docker run --name neo4j -p 7474:7474 -p 7687:7687 -v C:\Users\Turqut\neo4j-data-backup:/data -e NEO4J_AUTH=neo4j/test1234Neo -e NEO4J_server_memory_heap_initial__size=512m -e NEO4J_server_memory_heap_max__size=1G -e NEO4J_server_memory_pagecache__size=512m -e NEO4J_server_config_strict__validation_enabled=false -d neo4j:5.11
)

echo Waiting 15 seconds for Neo4j to initialize...
timeout /t 15 /nobreak >nul

start "Relic Backend" cmd /k pushd "%~dp0backend" ^&^& call venv\Scripts\activate.bat ^&^& uvicorn app.main:app --reload ^&^& popd

start "Relic Frontend" cmd /k pushd "%~dp0frontend" ^&^& npm run dev ^&^& popd

echo.
echo Relic System is running!
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8000
echo.
pause
