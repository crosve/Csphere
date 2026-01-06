

class EmbeddingManagerNotFound(Exception):
    pass


class NoMatchedContent(Exception):
    pass


class ContentItemNotFound(Exception):
    def __init__(self, content_id: str):
        super().__init__(f"Content item with content id {content_id} not found")


class NotesNotFound(Exception):
    def __init__(self, content_id: str):
        super().__init__(f"Notes for bookmark {content_id} not found")