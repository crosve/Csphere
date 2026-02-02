import json
import os
import csv

# Path to Chrome Bookmarks on macOS
path = os.path.expanduser('~/Library/Application Support/Google/Chrome/Default/Bookmarks')

with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

bookmarks_list = []

def collect_bookmarks(node, folder_path="Root"):
    # If it's a folder, dive deeper
    if node.get('type') == 'folder':
        new_path = f"{folder_path} > {node.get('name')}"
        for child in node.get('children', []):
            collect_bookmarks(child, new_path)
    # If it's a URL, save it
    elif node.get('type') == 'url':
        bookmarks_list.append({
            'Name': node.get('name'),
            'URL': node.get('url'),
            'Folder': folder_path,
            'Date Added': node.get('date_added') # Optional: Chrome uses a unique timestamp
        })

# Focus on the main roots
roots = data.get('roots', {})
for root_name in ['bookmark_bar', 'other', 'synced']:
    if root_name in roots:
        collect_bookmarks(roots[root_name], root_name.upper())

# Write to CSV
output_file = 'chrome_bookmarks.csv'
keys = ['Name', 'URL', 'Folder', 'Date Added']

with open(output_file, 'w', newline='', encoding='utf-8') as output:
    dict_writer = csv.DictWriter(output, fieldnames=keys)
    dict_writer.writeheader()
    dict_writer.writerows(bookmarks_list)

print(f"Success! Exported {len(bookmarks_list)} bookmarks to {output_file}")


#ensure it's a valid url 


#detect what os the user is on