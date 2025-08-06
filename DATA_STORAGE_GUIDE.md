# AnythingLLM Data Storage Guide

All data in AnythingLLM is stored under the `server/storage/` directory. Here's a complete breakdown:

## Main Storage Directory
`/Users/linhpham/Desktop/test/anything-llm/server/storage/`

## Storage Structure

### 1. **Database File**
- **Location**: `server/storage/anythingllm.db`
- **Type**: SQLite database
- **Contains**:
  - User accounts and authentication
  - Workspaces configuration
  - Chat history
  - System settings
  - API keys
  - Document metadata
  - Agent configurations

### 2. **Documents**
- **Location**: `server/storage/documents/`
- **Purpose**: Stores original uploaded documents
- **Structure**: Organized by workspace folders

### 3. **Vector Cache**
- **Location**: `server/storage/vector-cache/`
- **Purpose**: Caches computed embeddings for faster retrieval
- **Format**: JSON files containing vector embeddings

### 4. **LanceDB** (if using LanceDB vector database)
- **Location**: `server/storage/lancedb/`
- **Purpose**: Vector database storage
- **Contains**: Embedded document chunks and metadata

### 5. **Models**
- **Location**: `server/storage/models/`
- **Purpose**: Downloaded AI models (if using local models)
- **Subfolders**:
  - `downloaded/` - Downloaded model files
  - `whisper/` - Speech-to-text models

### 6. **Assets**
- **Location**: `server/storage/assets/`
- **Purpose**: Application assets and resources
- **Contains**: Logos, avatars, and other media files

### 7. **Communication Keys**
- **Location**: `server/storage/comkey/`
- **Purpose**: RSA keys for secure inter-service communication

## Collector Storage
- **Location**: `collector/storage/`
- **Purpose**: Temporary storage for document processing
- **Note**: Files are processed and moved to server storage

## Environment Files
- **Server Config**: `server/.env`
- **Frontend Config**: `frontend/.env`

## Logs
- **Server Log**: `server.log` (when running in production)
- **Collector Log**: `collector.log` (when running in production)

## Backup Recommendations

To backup your AnythingLLM instance, backup these critical items:
1. `server/storage/anythingllm.db` - All configuration and chat history
2. `server/storage/documents/` - Original uploaded documents
3. `server/storage/lancedb/` - Vector embeddings (if using LanceDB)
4. `server/.env` - Configuration settings

## Storage Permissions

Ensure the storage directory has proper permissions:
```bash
chmod -R 755 server/storage
```

## Accessing the Database

### Option 1: SQLite CLI
```bash
sqlite3 server/storage/anythingllm.db
```

### Option 2: Web Interface (after fixing)
```bash
./start-node-db-viewer.sh
```
Access at: http://localhost:5001

### Option 3: Python Web Interface
```bash
./start-db-viewer.sh
```
Access at: http://localhost:5050

### Option 4: GUI Applications
Use any SQLite browser and open:
`/Users/linhpham/Desktop/test/Genomain/server/storage/anythingllm.db`

## Important Notes

- All data is stored locally on your machine
- The SQLite database contains all critical application data
- Vector embeddings are cached for performance
- Document processing happens in the collector before storage
- Always stop services before backing up the database