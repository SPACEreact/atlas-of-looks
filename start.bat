@echo off
cd /d %~dp0
if not exist node_modules call npm install
echo.
echo  Atlas of Looks  —  http://localhost:5173
echo.
call npm run dev
