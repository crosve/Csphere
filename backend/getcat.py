import requests

# Variables
collection_name = "csphere"  
file_url = "http://crosve.com/test.txt" 

# Build the category API URL
cat_url = (
    "https://clavisds02.feeltiptop.com/demos/anesh/iabcatfromsolr.php"
    f"?solrhost=clavisds01.feeltiptop.com"
    f"&coll={collection_name}"
    f"&q=urlF:{file_url}"
)

# Send GET request
response = requests.get(cat_url,  verify=False)


