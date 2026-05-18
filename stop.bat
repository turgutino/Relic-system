@echo off
setlocal
cd /d "%~dp0"

echo Stopping Neo4j container...
docker stop neo4j 2>nul

echo Stopping services on ports 8000 ^(backend^) and 3000 ^(frontend^)...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "foreach ($p in @(8000,3000)) { Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"

echo.
echo Relic System stopped.
pause
