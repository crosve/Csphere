import requests
import json
import argparse
from collections import defaultdict
from typing import Dict, Optional
import os

class SolrQuery:
    """Base class for Solr interactions."""
    
    def __init__(self, collection="csphere", solr_host="clavisds01.feeltiptop.com"):
        self.COLLECTION = collection
        self.SOLR_HOST = solr_host
        self.PROCESSING_API = "https://clavisds02.feeltiptop.com/aiprocessing/api/v1/artifacts/add"
        self.CATEGORIES_API = "https://clavisds02.feeltiptop.com/demos/anesh/iabcatfromsolr.php"

    def _post_file(self, url: str, files: dict, data: dict):
        """Helper method for posting files to a processing API."""
        print(f"[*] Uploading to {url}...")
        resp = requests.post(url, files=files, data=data, verify=False)
        print(f"Status: {resp.status_code}")
        print(resp.text)
        print("Response headers: ", resp.headers)
        return resp

    def _get_request(self, url: str, params: dict):
        """Helper for GET requests."""
        resp = requests.get(url, params=params, verify=False)
        print(f"GET {url} -> {resp.status_code}")
        return resp


class SolrQueryIAB(SolrQuery):
    """Handles IAB-specific Solr operations."""

    def __init__(self, file_path: str = '', title: str = 'csphere-cat',
                 file_url: str = '', ai_summary: str = '', cutoff : float = .1):
        super().__init__()
        self.file_path = file_path
        self.title = title
        print("current file url: ", file_url)
    
        self.file_url = file_url #make sure file_url is there
        self.ai_summary = ai_summary

        self.cutoff = cutoff

    

    def _build_metadata(self) -> str:
        """Returns standard metadata JSON."""
        return json.dumps({
            "metadata": [
                {"key": "frompdf_b", "value": "false"},
                {"key": "user_s", "value": "crosve"},
                {"key": "fromurl_b", "value": "false"}
            ]
        })

    def get_file_content(self) -> Optional[Dict[str, object]]:
        """Opens file and returns as dict for requests."""
        if not self.file_path:
            return None
        file_path = os.path.join(os.path.dirname(__file__), 'dummy.txt')
        with open(file_path, 'w') as f:
            f.write(self.ai_summary)
        return {'file': open(file_path, 'rb')}

    def index_data(self):
        """Uploads file to the processing API."""
        files = self.get_file_content()

        print("file retrieved: ", files)
        if not files:
            print("No file to upload.")
            return
        try:
            print("file url: ", self.file_url)
            data = {
                "url": self.file_url,
                "solrHost": self.SOLR_HOST,
                "collection": self.COLLECTION,
                "title": self.title,
                "specialValsJson": self._build_metadata(),
                "force": "1"
            }
            self._post_file(self.PROCESSING_API, files, data)
        finally:
            for f in files.values():
                f.close()

    def index_html_data(self, url: str):
        """Uploads HTML content to Solr."""
        html_content = self.get_html_content(url)
        if not html_content:
            print("No HTML content retrieved.")
            return
        files = {'file': html_content}
        data = {
            "url": 'html-content',
            "solrHost": self.SOLR_HOST,
            "collection": self.COLLECTION,
            "title": self.title,
            "specialValsJson": self._build_metadata(),
            "force": "1"
        }
        self._post_file(self.PROCESSING_API, files, data)

    def get_html_categories(self):
        """Fetches categories for HTML content."""
        params = {
            "solrhost": self.SOLR_HOST,
            "coll": self.COLLECTION,
            "q": 'urlF:"html-content"'
        }
        resp = self._get_request(self.CATEGORIES_API, params)
        result = self.parse_categories(resp.text)
        self.print_dict(result)
        return result

    def get_categories(self):
        """Fetches categories for the uploaded file."""
        params = {
            "solrhost": self.SOLR_HOST,
            "coll": self.COLLECTION,
            "q": f'urlF:"{self.file_url}"'
        }
        resp = self._get_request(self.CATEGORIES_API, params)
        result = self.parse_categories(resp.text)
        self.print_dict(result)
        return result

    def get_html_content(self, url: str) -> Optional[str]:
        """Retrieves HTML content from a URL."""
        try:
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            return resp.text
        except Exception as e:
            print(f"Error fetching HTML: {e}")
            return None

    def parse_categories(self, cat_string: str) -> dict:
        """Parses categories into a dict."""
        res = defaultdict(list)
        for category in cat_string.split(','):
            parts = category.strip().split(':')
            if len(parts) < 2:
                continue
            key_part, rest = parts[0], parts[1]
            key = key_part.replace('[', '').replace(']', '')
            score_str = rest.strip()[:4]
            try:
                score = float(score_str)
            except ValueError:
                score = 0.0
            
            if score >= self.cutoff:
                #process the subtopic after the '/'
                parts = key.split('/')

                if len(parts) >= 2:



                    res[key].append((parts[1].strip(), score))
                elif len(parts) == 1:
                    res[key].append((parts[0], score))
                else:
                    print("the current parts seperated: ", parts)
                    res[key].append((key, score))
        return res
    
    #Setters and getters
    def setCutOff(self, cutoff: float) -> None :

        self.cutoff = cutoff
    


    #Helper functions 
    def print_dict(self, dic: dict):
        """Pretty prints dictionary contents."""
        for key, values in dic.items():
            print(f"{key}: {values}\n")

    def setAiSummary(self, ai_summary):
        print("setting ai summary as : ", ai_summary)
        self.ai_summary = ai_summary
        with open(self.file_path, 'w') as f:
                f.write(self.ai_summary)
                print("written succesfully")


# if __name__ == "__main__":
#     parser = argparse.ArgumentParser(description="Solr IAB Data Processor")
#     parser.add_argument('--upload', action='store_true', help='Upload file to processing API')
#     parser.add_argument('--check', action='store_true', help='Check categories for file')
#     parser.add_argument('--html', action='store_true', help='Upload HTML content to Solr')
#     parser.add_argument('--htmlcat', action='store_true', help='Fetch HTML categories')
#     parser.add_argument('--test', action='store_true', help='Fetch HTML categories')
#     args = parser.parse_args()

#     solr_iab = SolrQueryIAB(file_path="dummy.txt", file_url="https://www.youtube.com/watch?v=6yncRcxWWXg")

#     if args.upload:
#         solr_iab.index_data()
#     elif args.check:
#         solr_iab.get_categories()
#     elif args.html:
#         solr_iab.index_html_data("https://www.youtube.com/watch?v=6yncRcxWWXg")
#     elif args.htmlcat:
#         solr_iab.get_html_categories()

#     # elif args.test:
#     #     solr_iab.test_open()
#     else:
#         print("Invalid option. Choose --upload, --check, --html, or --htmlcat.")
