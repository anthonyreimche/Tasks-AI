@echo off
echo Starting Tasks AI server...

:: Check if Python is available
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Python found, starting server on port 8000...
    echo.
    echo Server running at: http://localhost:8000
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    python -m http.server 8000
    goto :end
)

:: Check if Python3 is available
where python3 >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Python3 found, starting server on port 8000...
    echo.
    echo Server running at: http://localhost:8000
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    python3 -m http.server 8000
    goto :end
)

:: Check if Node.js is available
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Node.js found, creating temporary server file...
    
    :: Create a temporary server.js file
    echo const http = require('http'); > temp-server.js
    echo const fs = require('fs'); >> temp-server.js
    echo const path = require('path'); >> temp-server.js
    echo. >> temp-server.js
    echo const PORT = 8000; >> temp-server.js
    echo. >> temp-server.js
    echo const MIME_TYPES = { >> temp-server.js
    echo   '.html': 'text/html', >> temp-server.js
    echo   '.js': 'text/javascript', >> temp-server.js
    echo   '.css': 'text/css', >> temp-server.js
    echo   '.json': 'application/json', >> temp-server.js
    echo   '.png': 'image/png', >> temp-server.js
    echo   '.jpg': 'image/jpg', >> temp-server.js
    echo   '.gif': 'image/gif', >> temp-server.js
    echo   '.svg': 'image/svg+xml', >> temp-server.js
    echo   '.ico': 'image/x-icon' >> temp-server.js
    echo }; >> temp-server.js
    echo. >> temp-server.js
    echo const server = http.createServer((req, res) => { >> temp-server.js
    echo   console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`); >> temp-server.js
    echo. >> temp-server.js
    echo   // Handle default route >> temp-server.js
    echo   let filePath = '.' + req.url; >> temp-server.js
    echo   if (filePath === './') { >> temp-server.js
    echo     filePath = './index.html'; >> temp-server.js
    echo   } >> temp-server.js
    echo. >> temp-server.js
    echo   const extname = path.extname(filePath); >> temp-server.js
    echo   const contentType = MIME_TYPES[extname] || 'application/octet-stream'; >> temp-server.js
    echo. >> temp-server.js
    echo   fs.readFile(filePath, (error, content) => { >> temp-server.js
    echo     if (error) { >> temp-server.js
    echo       if (error.code === 'ENOENT') { >> temp-server.js
    echo         fs.readFile('./index.html', (err, content) => { >> temp-server.js
    echo           if (err) { >> temp-server.js
    echo             res.writeHead(500); >> temp-server.js
    echo             res.end('Error loading index.html'); >> temp-server.js
    echo           } else { >> temp-server.js
    echo             res.writeHead(200, { 'Content-Type': 'text/html' }); >> temp-server.js
    echo             res.end(content, 'utf-8'); >> temp-server.js
    echo           } >> temp-server.js
    echo         }); >> temp-server.js
    echo       } else { >> temp-server.js
    echo         res.writeHead(500); >> temp-server.js
    echo         res.end(`Server Error: ${error.code}`); >> temp-server.js
    echo       } >> temp-server.js
    echo     } else { >> temp-server.js
    echo       res.writeHead(200, { 'Content-Type': contentType }); >> temp-server.js
    echo       res.end(content, 'utf-8'); >> temp-server.js
    echo     } >> temp-server.js
    echo   }); >> temp-server.js
    echo }); >> temp-server.js
    echo. >> temp-server.js
    echo server.listen(PORT, () => { >> temp-server.js
    echo   console.log(`Server running at http://localhost:${PORT}/`); >> temp-server.js
    echo   console.log('Press Ctrl+C to stop the server'); >> temp-server.js
    echo }); >> temp-server.js
    
    echo Node.js server starting on port 8000...
    echo.
    echo Server running at: http://localhost:8000
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    node temp-server.js
    
    :: Clean up the temporary file when done
    del temp-server.js
    goto :end
)

:: If we get here, no suitable server option was found
echo No suitable server option found (Python or Node.js).
echo.
echo Please install one of the following to run a local server:
echo.
echo 1. Python (https://www.python.org/downloads/)
echo 2. Node.js (https://nodejs.org/)
echo.
echo Alternatively, you can use one of these options:
echo.
echo - Install a web server like XAMPP, WAMP, or Nginx
echo - Use Visual Studio Code with the "Live Server" extension
echo - Use any other web server of your choice
echo.
pause

:end
