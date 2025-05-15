import os
import json
import time
from pathlib import Path
from seleniumwire import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions

# Configurable browser
BROWSER = os.getenv('SELENIUM_BROWSER', 'chrome')
DATA_DIR = Path(os.getenv('TWIKIT_DATA_DIR', './twitter_data'))
DATA_DIR.mkdir(parents=True, exist_ok=True)

COOKIES_PATH = DATA_DIR / 'twitter_cookies.json'
HEADERS_PATH = DATA_DIR / 'twitter_headers.json'
COMMON_HEADERS_PATH = DATA_DIR / 'twitter_common_headers.json'
HOME_PATH = DATA_DIR / 'twitter_home.html'
ONDEMAND_PATH = DATA_DIR / 'twitter_ondemand.js'

# Helper to launch browser
def get_driver():
    if BROWSER == 'firefox':
        options = FirefoxOptions()
        options.set_preference('dom.webdriver.enabled', False)
        driver = webdriver.Firefox(options=options)
    else:
        options = ChromeOptions()
        options.add_argument('--disable-blink-features=AutomationControlled')
        driver = webdriver.Chrome(options=options)
    return driver

def main():
    driver = get_driver()
    driver.get('https://x.com/login')
    print("\nPlease log in manually in the browser window (including 2FA if needed).\n")
    input("Press Enter here after you have completed login and see your home feed...")

    print("\nNow browse and interact with Twitter to generate various requests.")
    print("Try different actions like refreshing pages, viewing profiles, etc.")
    input("Press Enter when you're done...\n")

    # Save cookies
    cookies = driver.get_cookies()
    with open(COOKIES_PATH, 'w') as f:
        json.dump(cookies, f, indent=2)
    print(f"Cookies saved to {COOKIES_PATH}")

    # Save home page HTML
    driver.get('https://x.com/home')
    time.sleep(3)
    with open(HOME_PATH, 'w', encoding='utf-8') as f:
        f.write(driver.page_source)
    print(f"Home page HTML saved to {HOME_PATH}")

    # Find ondemand.js URL
    scripts = driver.find_elements(By.TAG_NAME, 'script')
    ondemand_url = None
    for script in scripts:
        src = script.get_attribute('src')
        if src and 'ondemand.s' in src:
            ondemand_url = src
            break
    if ondemand_url:
        print(f"Found ondemand.s file: {ondemand_url}")
        # Download ondemand.js using requests with Selenium cookies
        import requests
        session = requests.Session()
        for cookie in cookies:
            session.cookies.set(cookie['name'], cookie['value'], domain=cookie.get('domain', '.x.com'))
        resp = session.get(ondemand_url)
        with open(ONDEMAND_PATH, 'w', encoding='utf-8') as f:
            f.write(resp.text)
        print(f"Ondemand file saved to {ONDEMAND_PATH} ({len(resp.text)} bytes)")
    else:
        print("Could not find ondemand.js URL.")

    # Save all captured request headers
    all_headers = []
    for request in driver.requests:
        if request.response:
            all_headers.append({
                'url': request.url,
                'headers': dict(request.headers),
                'response_headers': dict(request.response.headers)
            })
    with open(HEADERS_PATH, 'w') as f:
        json.dump(all_headers, f, indent=2)
    print(f"Saved {len(all_headers)} unique header sets to {HEADERS_PATH}")

    # Process and save common headers (most frequent in requests)
    from collections import Counter
    header_counter = Counter()
    header_values = {}
    for entry in all_headers:
        req_headers = entry.get('headers', {})
        for header, value in req_headers.items():
            header_counter[header] += 1
            if header not in header_values:
                header_values[header] = Counter()
            header_values[header][value] += 1
    min_frequency = int(len(all_headers) * 0.75) if all_headers else 1
    common_headers = {}
    for header, count in header_counter.items():
        if count >= min_frequency:
            most_common = header_values[header].most_common(1)
            if most_common:
                common_headers[header] = most_common[0][0]
    with open(COMMON_HEADERS_PATH, 'w') as f:
        json.dump(common_headers, f, indent=2)
    print(f"Processed and saved {len(common_headers)} common headers to {COMMON_HEADERS_PATH}")

    driver.quit()

if __name__ == "__main__":
    main() 