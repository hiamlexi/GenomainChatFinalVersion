const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.DB_VIEWER_PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Database path
const dbPath = path.join(__dirname, '../storage/anythingllm.db');

// HTML interface
const htmlInterface = `
<!DOCTYPE html>
<html>
<head>
    <title>AnythingLLM Database Viewer</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 30px;
            font-size: 28px;
        }
        .info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
            font-size: 14px;
            color: #1565c0;
        }
        .section {
            margin-bottom: 40px;
        }
        h2 {
            color: #34495e;
            font-size: 20px;
            margin-bottom: 15px;
        }
        .tables-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
            margin-bottom: 30px;
        }
        .table-btn {
            background: #3498db;
            color: white;
            padding: 12px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }
        .table-btn:hover {
            background: #2980b9;
        }
        textarea {
            width: 100%;
            height: 120px;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 13px;
            resize: vertical;
        }
        .execute-btn {
            background: #27ae60;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 10px;
        }
        .execute-btn:hover {
            background: #229954;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 14px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ecf0f1;
        }
        th {
            background: #34495e;
            color: white;
            font-weight: 600;
        }
        tr:hover {
            background: #f8f9fa;
        }
        .error {
            background: #fee;
            color: #c00;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
        }
        .success {
            background: #efe;
            color: #060;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
        }
        .result-info {
            color: #7f8c8d;
            margin-top: 10px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🗄️ AnythingLLM Database Viewer</h1>
        
        <div class="info">
            <strong>Database Location:</strong> ${dbPath}<br>
            <strong>Access URL:</strong> http://localhost:${PORT}<br>
            <strong>Note:</strong> Only SELECT queries are allowed for safety.
        </div>
        
        <div class="section">
            <h2>📊 Database Tables</h2>
            <div id="tables" class="tables-grid"></div>
        </div>
        
        <div class="section">
            <h2>🔍 Custom Query</h2>
            <textarea id="query" placeholder="Enter your SQL query here (SELECT only)...">SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;</textarea>
            <button class="execute-btn" onclick="executeQuery()">Execute Query</button>
            <div id="queryResult"></div>
        </div>
        
        <div class="section">
            <h2>📋 Results</h2>
            <div id="results"></div>
        </div>
    </div>
    
    <script>
        async function loadTables() {
            try {
                const response = await fetch('/api/tables');
                const tables = await response.json();
                const container = document.getElementById('tables');
                container.innerHTML = tables.map(table => 
                    \`<button class="table-btn" onclick="viewTable('\${table}')">\${table}</button>\`
                ).join('');
            } catch (error) {
                console.error('Error loading tables:', error);
            }
        }
        
        async function viewTable(tableName) {
            const query = \`SELECT * FROM \${tableName} LIMIT 100\`;
            document.getElementById('query').value = query;
            await executeQuery();
        }
        
        async function executeQuery() {
            const query = document.getElementById('query').value;
            const resultDiv = document.getElementById('queryResult');
            const resultsDiv = document.getElementById('results');
            
            try {
                const response = await fetch('/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                
                const data = await response.json();
                
                if (data.error) {
                    resultDiv.innerHTML = \`<div class="error">❌ Error: \${data.error}</div>\`;
                    resultsDiv.innerHTML = '';
                } else {
                    resultDiv.innerHTML = \`<div class="success">✅ Query executed successfully</div>\`;
                    displayResults(data.rows, data.count);
                }
            } catch (error) {
                resultDiv.innerHTML = \`<div class="error">❌ Error: \${error.message}</div>\`;
                resultsDiv.innerHTML = '';
            }
        }
        
        function displayResults(rows, count) {
            const resultsDiv = document.getElementById('results');
            
            if (!rows || rows.length === 0) {
                resultsDiv.innerHTML = '<p class="result-info">No results found.</p>';
                return;
            }
            
            const columns = Object.keys(rows[0]);
            let html = \`<p class="result-info">Found \${count} rows (showing first \${rows.length})</p>\`;
            html += '<table>';
            html += '<tr>' + columns.map(col => \`<th>\${col}</th>\`).join('') + '</tr>';
            
            rows.forEach(row => {
                html += '<tr>';
                columns.forEach(col => {
                    let value = row[col];
                    if (value === null) value = '<i style="color: #999;">NULL</i>';
                    else if (typeof value === 'object') value = JSON.stringify(value);
                    html += \`<td>\${value}</td>\`;
                });
                html += '</tr>';
            });
            
            html += '</table>';
            resultsDiv.innerHTML = html;
        }
        
        // Load tables on page load
        loadTables();
    </script>
</body>
</html>
`;

// Routes
app.get('/', (req, res) => {
    res.send(htmlInterface);
});

app.get('/api/tables', (req, res) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
    
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows.map(row => row.name));
        }
        db.close();
    });
});

app.post('/api/query', express.json(), (req, res) => {
    const { query } = req.body;
    
    // Safety check - only allow SELECT queries
    if (!query || !query.trim().toUpperCase().startsWith('SELECT')) {
        return res.status(400).json({ error: 'Only SELECT queries are allowed' });
    }
    
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
    
    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ 
                rows: rows.slice(0, 100), // Limit to 100 rows
                count: rows.length 
            });
        }
        db.close();
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`AnythingLLM Database Viewer running at http://localhost:${PORT}`);
    console.log(`Database: ${dbPath}`);
    console.log('Press Ctrl+C to stop the server');
});