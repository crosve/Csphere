import subprocess
import os

def archive_page(url, filename):
    # 1. Ensure the URL starts with http/https
    if not url.startswith("http"):
        url = "https://" + url

    # 2. Setup paths
    output_dir = "archives"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    output_path = os.path.join(output_dir, f"{filename}.html")

    # 3. The Command
    # We use --output to be explicit about where the file goes
    #--block-scripts true
    command = [
        "npx",
        "single-file-cli",
        url,
        output_path
    ]

    print(f"🌐 Archiving: {url}")
    
    try:
        # We run this through the shell or direct call
        result = subprocess.run(command, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Saved to: {output_path}")
            print(f"📍 Absolute Path: {os.path.abspath(output_path)}")
        else:
            print(f"❌ Error: {result.stderr}")
            
    except Exception as e:
        print(f"🚨 Script failed: {e}")

if __name__ == "__main__":
    # Test it with a real site
    archive_page("https://store.djomusic.com/?srsltid=AfmBOor0dKTBwmpuMReApIcaQejvRBXJeySqrVAhw-JOs8QXyaCxLqGv", "djo_test")