


class FoldersNotFound(Exception):
    pass

class ItemExistInFolder(Exception):
    def __init__(self, item_id: str, folder_id: str):
        self.item_id = item_id
        self.folder_id = folder_id
        super().__init__(f"Item {item_id} already exists in folder {folder_id}")

class EmbeddingNotFound(Exception):
    def __init__(self, content_id: str):
        self.content_id = content_id
        super().__init__(f"Embedding for content id {content_id} does not exist")

class ContentSummaryNotFound(Exception):
    def __init__(self, content_id: str):
        super().__init__(f'Summary for content item with id {content_id} failed to fetch or not found')