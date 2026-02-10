import asyncio
from playwright.async_api import async_playwright

async def capture_page(url, output_name):
    async with async_playwright() as p:
        # Launch a headless browser
        browser = await p.chromium.launch()
        page = await browser.new_page()

        print(f"Archiving: {url}...")
        
        # Go to the URL and wait until the network is idle
        await page.goto(url, wait_until="networkidle")

        # 1. Save as PDF (The 'Permanent' copy)
        await page.pdf(path=f"{output_name}.pdf", format="A4")
        
        # 2. Extract Full Text (For the 'Search' index)
        # inner_text() grabs what a human sees, ignoring HTML tags
        text_content = await page.content() # Raw HTML
        visible_text = await page.inner_text("body")
        
        with open(f"{output_name}_content.txt", "w", encoding="utf-8") as f:
            f.write(visible_text)

        print(f"Success! Saved {output_name}.pdf and {output_name}_content.txt")
        await browser.close()

# Test it out
url_to_save = "https://en.wikipedia.org/wiki/Web_archiving"
asyncio.run(capture_page(url_to_save, "my_archive_test"))