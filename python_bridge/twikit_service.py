import asyncio
import json
import sys
import os
from pathlib import Path
from urllib.parse import urlparse
import importlib.util

# Import TwitterAuthenticator from playwright_login_and_export.py
from playwright_login_and_export import TwitterAuthenticator

async def main():
    data_dir = os.getenv('TWIKIT_DATA_DIR', './twitter_data')
    username = os.getenv('TWIKIT_USERNAME')
    email = os.getenv('TWIKIT_EMAIL')
    password = os.getenv('TWIKIT_PASSWORD')
    cookies_file = os.getenv('TWIKIT_COOKIES_FILE')

    # Try to use Playwright-captured authentication data
    try:
        auth = TwitterAuthenticator(data_dir=data_dir)
        common_headers = auth.get_common_headers()
        cookies_dict = auth.get_cookies_dict()
        home_html, ondemand_js = auth.get_public_transaction_generator_data()
        if not (common_headers and cookies_dict and home_html and ondemand_js):
            sys.stderr.write("ERROR: Required authentication or transaction generator data is missing.\n")
            sys.stderr.write("Please run playwright_login_and_export.py first and ensure you are logged in.\n")
            sys.stdout.write(json.dumps({"id": None, "success": False, "error": "Missing authentication or transaction generator data"}) + '\n')
            sys.stdout.flush()
            return
        # Set up transaction generator
        from x_client_transaction import ClientTransaction
        import bs4
        home_soup = bs4.BeautifulSoup(home_html, 'html.parser')
        ondemand_soup = bs4.BeautifulSoup(ondemand_js, 'html.parser')
        transaction_generator = ClientTransaction(home_page_response=home_soup, ondemand_file_response=ondemand_soup)
        sys.stderr.write("Loaded authentication and transaction generator data from Playwright export.\n")
    except Exception as e:
        sys.stderr.write(f"Error loading Playwright authentication data: {str(e)}\n")
        sys.stdout.write(json.dumps({"id": None, "success": False, "error": str(e)}) + '\n')
        sys.stdout.flush()
        return

    # Notify Node.js that Python service is ready
    ready_signal = {"status": "ready"}
    sys.stdout.write(json.dumps(ready_signal) + '\n')
    sys.stdout.flush()

    # Process commands from stdin
    loop = asyncio.get_event_loop()
    while True:
        line = await loop.run_in_executor(None, sys.stdin.readline)
        if not line:
            break # EOF
        request_id = None
        try:
            command_data = json.loads(line)
            request_id = command_data.get('id')
            action = command_data.get('action')
            args = command_data.get('args', {})
            if not action:
                raise ValueError("Missing 'action' in command")
            if action == 'get_transaction_id':
                # Expects 'url' and 'method' in args
                if 'url' not in args or 'method' not in args:
                    raise ValueError("Missing 'url' or 'method' for get_transaction_id action")
                method = args['method']
                url = args['url']
                try:
                    path = urlparse(url).path
                    transaction_id = transaction_generator.generate_transaction_id(method=method, path=path)
                    response_data = {"id": request_id, "success": True, "data": transaction_id}
                except Exception as e:
                    response_data = {"id": request_id, "success": False, "error": f"Failed to generate transaction ID: {str(e)}"}
            else:
                response_data = {"id": request_id, "success": False, "error": f"Unknown action '{action}'"}
        except json.JSONDecodeError as e:
            response_data = {"id": request_id, "success": False, "error": f"Invalid JSON command: {str(e)}"}
        except Exception as e:
            response_data = {"id": request_id, "success": False, "error": str(e)}
        sys.stdout.write(json.dumps(response_data) + '\n')
        sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(main())