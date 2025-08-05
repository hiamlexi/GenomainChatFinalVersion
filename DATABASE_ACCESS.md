# AnythingLLM Database Access

AnythingLLM uses SQLite as its database, which is stored locally at:
`/Users/linhpham/Desktop/test/anything-llm/server/storage/anythingllm.db`

## Access Methods

### 1. Python Web Interface (Port 5000)
```bash
./start-db-viewer.sh
```
- Access at: http://localhost:5000
- Features: Table browsing, custom queries, schema viewing
- Requires: Python 3 with Flask

### 2. Node.js Web Interface (Port 5001)
```bash
./start-node-db-viewer.sh
```
- Access at: http://localhost:5001
- Features: Table browsing, custom queries, integrated with AnythingLLM
- Requires: Node.js (already installed with AnythingLLM)

### 3. SQLite Command Line
```bash
sqlite3 /Users/linhpham/Desktop/test/anything-llm/server/storage/anythingllm.db
```

### 4. GUI Applications
You can also use SQLite GUI applications like:
- DB Browser for SQLite: https://sqlitebrowser.org/
- TablePlus: https://tableplus.com/
- DBeaver: https://dbeaver.io/

Simply open the database file located at:
`/Users/linhpham/Desktop/test/anything-llm/server/storage/anythingllm.db`

## Important Tables

- `users` - User accounts and authentication
- `workspaces` - Workspace configurations
- `workspace_documents` - Documents added to workspaces
- `workspace_chats` - Chat history
- `system_settings` - System configuration
- `api_keys` - API key management

## Safety Notes

- The web interfaces only allow SELECT queries for safety
- Always backup the database before making direct modifications
- The database file is automatically managed by AnythingLLM

## Stopping the Database Viewers

Press `Ctrl+C` in the terminal where the viewer is running to stop it.