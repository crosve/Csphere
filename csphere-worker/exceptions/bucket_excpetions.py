


class FoldersNotFound(Exception):
    pass

class ItemExistInFolder(Exception):
    def __init__(self, item_id: str, folder_id: str):
        self.item_id = item_id
        self.folder_id = folder_id
        super().__init__(f"Item {item_id} already exists in folder {folder_id}")