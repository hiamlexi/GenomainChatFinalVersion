#!/usr/bin/env python3
"""
Simple SQLite Database Viewer for AnythingLLM
Provides a web interface to view and query the SQLite database
"""

import sqlite3
import json
from flask import Flask, jsonify, request, render_template_string
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Database path
DB_PATH = "/Users/linhpham/Desktop/test/Genomain/server/storage/anythingllm.db"

# HTML template for the web interface
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>AnythingLLM SQLite Database Viewer</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 30px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .query-box {
            width: 100%;
            margin-bottom: 10px;
        }
        textarea {
            width: 100%;
            height: 100px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
        }
        button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #45a049;
        }
        .error {
            color: red;
            margin-top: 10px;
        }
        .success {
            color: green;
            margin-top: 10px;
        }
        .table-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 20px;
        }
        .table-link {
            background-color: #2196F3;
            color: white;
            padding: 8px 16px;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
        }
        .table-link:hover {
            background-color: #1976D2;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>AnythingLLM SQLite Database Viewer</h1>
        
        <div class="section">
            <h2>Database Tables</h2>
            <div id="tables" class="table-list"></div>
        </div>
        
        <div class="section">
            <h2>Custom Query</h2>
            <div class="query-box">
                <textarea id="query" placeholder="Enter your SQL query here (SELECT only for safety)">SELECT * FROM users LIMIT 10;</textarea>
                <button onclick="executeQuery()">Execute Query</button>
            </div>
            <div id="queryResult"></div>
        </div>
        
        <div class="section">
            <h2>Table Data</h2>
            <div id="tableData"></div>
        </div>
    </div>
    
    <script>
        async function fetchTables() {
            try {
                const response = await fetch('/api/tables');
                const tables = await response.json();
                const tablesDiv = document.getElementById('tables');
                tablesDiv.innerHTML = tables.map(table => 
                    `<a href="#" class="table-link" onclick="viewTable('${table}')">${table}</a>`
                ).join('');
            } catch (error) {
                console.error('Error fetching tables:', error);
            }
        }
        
        async function viewTable(tableName) {
            try {
                const response = await fetch(`/api/table/${tableName}`);
                const data = await response.json();
                displayData(data, `Table: ${tableName}`);
            } catch (error) {
                console.error('Error viewing table:', error);
            }
        }
        
        async function executeQuery() {
            const query = document.getElementById('query').value;
            try {
                const response = await fetch('/api/query', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query })
                });
                const result = await response.json();
                if (result.error) {
                    document.getElementById('queryResult').innerHTML = 
                        `<div class="error">Error: ${result.error}</div>`;
                } else {
                    displayData(result, 'Query Results', 'queryResult');
                }
            } catch (error) {
                document.getElementById('queryResult').innerHTML = 
                    `<div class="error">Error: ${error.message}</div>`;
            }
        }
        
        function displayData(data, title, targetId = 'tableData') {
            if (!data || data.length === 0) {
                document.getElementById(targetId).innerHTML = '<p>No data found</p>';
                return;
            }
            
            const columns = Object.keys(data[0]);
            let html = `<h3>${title}</h3><table>`;
            html += '<tr>' + columns.map(col => `<th>${col}</th>`).join('') + '</tr>';
            
            data.forEach(row => {
                html += '<tr>';
                columns.forEach(col => {
                    let value = row[col];
                    if (value === null) value = '<i>NULL</i>';
                    else if (typeof value === 'object') value = JSON.stringify(value);
                    html += `<td>${value}</td>`;
                });
                html += '</tr>';
            });
            
            html += '</table>';
            document.getElementById(targetId).innerHTML = html;
        }
        
        // Load tables on page load
        fetchTables();
    </script>
</body>
</html>
"""

def get_db_connection():
    """Create a database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    """Serve the main HTML page"""
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/tables')
def get_tables():
    """Get list of all tables in the database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [row[0] for row in cursor.fetchall()]
    conn.close()
    return jsonify(tables)

@app.route('/api/table/<table_name>')
def get_table_data(table_name):
    """Get data from a specific table"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Validate table name to prevent SQL injection
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cursor.fetchone():
            return jsonify({"error": "Table not found"}), 404
        
        # Get table data with limit
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 100")
        rows = cursor.fetchall()
        data = [dict(row) for row in rows]
        conn.close()
        return jsonify(data)
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/query', methods=['POST'])
def execute_query():
    """Execute a custom SQL query (SELECT only for safety)"""
    query = request.json.get('query', '')
    
    # Basic safety check - only allow SELECT queries
    if not query.strip().upper().startswith('SELECT'):
        return jsonify({"error": "Only SELECT queries are allowed"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(query)
        rows = cursor.fetchall()
        data = [dict(row) for row in rows]
        conn.close()
        return jsonify(data)
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/schema/<table_name>')
def get_table_schema(table_name):
    """Get schema information for a table"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"PRAGMA table_info({table_name})")
        schema = cursor.fetchall()
        data = [dict(row) for row in schema]
        conn.close()
        return jsonify(data)
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        print("Make sure AnythingLLM is installed and has created the database.")
    else:
        print("Starting SQLite Database Viewer...")
        print("Access the database at: http://localhost:5050")
        print("Press Ctrl+C to stop the server")
        app.run(host='localhost', port=5050, debug=True)