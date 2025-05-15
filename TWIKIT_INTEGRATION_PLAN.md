# Twikit Integration Plan for MCP X Server

This document outlines the steps to integrate the Python `twikit` library into the Node.js/TypeScript `mcp-x-server` using a managed child process approach.

## Phase 1: Setup and Python `twikit` Service

### Task 1.1: Create Directory Structure and Python Dependencies File
- **ID**: `T1.1`
- **Status**: `Done`
- **Details**:
    - Create a new directory: `python_bridge` in the root of your `mcp-x-server` project.
    - Inside `python_bridge/`, create a `requirements.txt` file with the following content:
      ```txt
      twikit==1.0.8
      aiohttp
      ```

### Task 1.2: Implement the Python `twikit_service.py`
- **ID**: `T1.2`
- **Status**: `Done`
- **Details**:
    - Create `python_bridge/twikit_service.py`.
    - The script will be a long-running service that:
        - Imports `asyncio`, `json`, `sys`, `os`, and `twikit.Client`.
        - Reads `TWIKIT_USERNAME`, `TWIKIT_EMAIL`, `TWIKIT_PASSWORD`, and `TWIKIT_COOKIES_FILE` from environment variables (use `os.getenv`).
        - Initializes `twikit.Client()`.
        - Implement an `async def main():` function:
            - Load cookies using `client.load_cookies(cookies_file_path)` if `TWIKIT_COOKIES_FILE` is set and the file exists.
            - Attempt `await client.login(auth_info_1=username, auth_info_2=email, password=password)`.
            - Save cookies using `client.save_cookies(cookies_file_path)` after successful login if `TWIKIT_COOKIES_FILE` is set.
            - Enter a loop to continuously read commands from `sys.stdin`:
                - `line = await loop.run_in_executor(None, sys.stdin.readline)`
                - If line is empty (EOF), break.
                - Parse the JSON `command = json.loads(line)`. Expect `{"id": "req_id", "action": "method_name", "args": {}}`.
                - Use a `try/except` block for command execution.
                - Based on `command['action']`, dynamically call `getattr(client, command['action'])(**command['args'])`.
                - Construct JSON response: `{"id": command['id'], "success": True, "data": result}` or `{"id": command['id'], "success": False, "error": str(e)}`.
                - Print JSON response to `sys.stdout.write(json.dumps(response) + '\n')` and `sys.stdout.flush()`.
        - Handle exceptions gracefully during login and command processing.
        - Call `asyncio.run(main())`.

## Phase 2: Node.js Bridge Client and Server Modifications

### Task 2.1: Create the `TwikitBridgeClient.ts`
- **ID**: `T2.1`
- **Status**: `Done`
- **Details**:
    - Create `src/client/twikitBridgeClient.ts`.
    - This TypeScript class will:
        - Import `spawn` from `child_process` and `EventEmitter` from `events`.
        - Manage a `child_process.ChildProcessWithoutNullStreams | null` property.
        - Maintain a `Map<string, { resolve: (value: any) => void, reject: (reason?: any) => void }>` for pending requests.
        - Implement `async startService(): Promise<void>`:
            - Spawns `python_bridge/twikit_service.py` using `python` (or `python3`).
            - Pass current `process.env` to the child process.
            - Listen to `stdout`: accumulate data, split by newline, parse JSON. For each JSON object, if it has an `id`, find the corresponding pending request and resolve/reject it.
            - Listen to `stderr`: log errors. Prepend "[Python stderr]" to messages.
            - Listen to `exit`: log exit code, reject all pending requests.
        - Implement `async stopService(): Promise<void>`: Kills the child process if running.
        - Implement public async methods (e.g., `async searchTweet(query: string, searchType: string)`):
            - Generate a unique request ID (e.g., using `crypto.randomUUID()`).
            - Store `resolve` and `reject` in the pending requests map.
            - Format JSON command: `{"id": requestId, "action": "search_tweet", "args": {"query": query, "search_type": searchType}}`.
            - Write command to child process's `stdin` (`this.pythonProcess.stdin.write(JSON.stringify(command) + '\n')`).
            - Return the promise.
        - Implement a request timeout mechanism.

### Task 2.2: Modify `src/index.ts` (Main Server File)
- **ID**: `T2.2`
- **Status**: `Done`
- **Details**:
    - Import `TwikitBridgeClient` and the existing `TwitterClient` (from `twitter-api-v2`).
    - At server startup:
        - Read `MCP_TWITTER_MODE` (default to "API").
        - Declare `let activeTwitterClient: any;`.
        - If `MCP_TWITTER_MODE === "TWIKIT"`:
            - Instantiate `TwikitBridgeClient`.
            - `await twikitBridgeClient.startService()`. Log success or failure.
            - `activeTwitterClient = twikitBridgeClient;`
        - Else:
            - Instantiate original `TwitterClient`.
            - `activeTwitterClient = originalTwitterApiClient;`
    - Pass `activeTwitterClient` to all tool handlers.
    - Ensure `twikitBridgeClient.stopService()` is called on server shutdown (e.g., SIGINT, SIGTERM).

### Task 2.3: Update Environment Variable Files
- **ID**: `T2.3`
- **Status**: `Done`
- **Details**:
    - Ensure `.env.example` (and the user's `.env`) includes:
      ```
      TWIKIT_USERNAME=
      TWIKIT_EMAIL=
      TWIKIT_PASSWORD=
      TWIKIT_COOKIES_FILE="python_bridge/twikit_cookies.json"
      MCP_TWITTER_MODE="API" 
      ```
    - Note: The `edit_file` tool was blocked for `.env.example`, so this might need manual application or a different strategy if direct edit fails again.

## Phase 3: Adapting Handlers and Tools

### Task 3.1: Adapt Tool Handlers
- **ID**: `T3.1`
- **Status**: `Done`
- **Details**:
    - Modify handler signatures in `src/handlers/*.handlers.ts` to accept a generic client (e.g., `client: TwitterClient | TwikitBridgeClient`).
    - Inside handlers that will use `twikit`:
        - Conditionally call methods on `TwikitBridgeClient` or `TwitterClient` based on the type of `activeTwitterClient` or the `MCP_TWITTER_MODE`.
        - Transform data from `twikit` responses to match the expected structure for `createResponse` and MCP tool outputs. This is crucial as `twikit`'s API and return objects will differ from `twitter-api-v2`.
        - Map `twikit` methods to existing conceptual operations (e.g., `client.search_tweet` in `twikit` for a "search tweets" tool).

### Task 3.2: Update `src/tools.ts` (If Necessary)
- **ID**: `T3.2`
- **Status**: `Done`
- **Details**:
    - Review if `twikit` functionalities require changes to `inputSchema` of existing tools.
    - Add new tool definitions if `twikit` offers unique features you want to expose.
    - Aim to keep tool schemas consistent where the underlying action is conceptually the same.

## Phase 4: Testing and Refinement

### Task 4.1: Comprehensive Testing
- **ID**: `T4.1`
- **Status**: `In Progress`
- **Details**:
    - Test with `MCP_TWITTER_MODE="API"` for regression.
    - Test with `MCP_TWITTER_MODE="TWIKIT"` for all adapted tools:
        - Python script startup and shutdown.
        - Twikit login and cookie persistence.
        - Each `twikit`-backed tool functionality.
        - Error propagation from Python to Node.js and to the MCP client.
        - Concurrent requests (if applicable).
    - Verify lifecycle management of the Python child process.

### Task 4.2: Refinement and Documentation
- **ID**: `T4.2`
- **Status**: `Pending`
- **Details**:
    - Refine error handling, logging across both Node.js and Python scripts.
    - Add comments and documentation for the new bridge mechanism.
    - Update `README.md` regarding the new `MCP_TWITTER_MODE` and `twikit` credentials. 