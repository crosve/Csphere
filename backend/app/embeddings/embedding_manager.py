from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import exists
from uuid import uuid4
from datetime import datetime, timezone

from app.core.logging import logger

#data models for the DB 
from app.data_models.content import Content
from app.data_models.content_ai import ContentAI
from app.data_models.category import Category
from app.data_models.content_item import ContentItem


from app.classes import iab
from dotenv import load_dotenv
from app.preprocessing.content_preprocessor import ContentPreprocessor
from app.ai.summarizer import Summarizer
from app.ai.embedder import Embedder
from app.ai.categorizer import Categorizer

from app.embeddings.semantic_cache import SemanticCache
from collections import defaultdict

load_dotenv()

class ContentEmbeddingManager:
    '''
    Manages:
        - Generating vector embeddings for content summaries
        - Inserting and retrieving content and their embeddings from the db
        - Enriching raw HTML content for a summarization model
        - Performing similarity queries on content embeddings
        - Handling database interactions for both `Content` and `ContentAI` models
    '''

    def __init__(self, db, embedding_model_name='text-embedding-3-small', content_url : str = '', preprocessor: ContentPreprocessor | None = None, summarizer: Summarizer | None = None, embedder: Embedder | None = None, categorizer: Categorizer | None = None):
        self.db = db
        self.embedding_model = embedding_model_name
        # self.summary_model = summary_model_name
        self.ai_summary = ''

        THRESHOLD = 0.8
        CAPACITY = 1000

        # Service Layers 
        self.preprocessor = preprocessor or ContentPreprocessor()
        self.summarizer = summarizer or Summarizer(model="openrouter/auto:floor")
        self.embedder = embedder or Embedder(model_name=self.embedding_model)
        self.categorizer = categorizer or Categorizer(file_url=content_url)
        
        # Cache Layer
        self.user_caches = defaultdict(
            lambda: SemanticCache(similarity_threshold=THRESHOLD, capacity=CAPACITY)
        )

        

    ###############################################################################
    # METHODS
    ###############################################################################


    def process_content(self, content: Content, raw_html)-> ContentAI | None:
        '''
        Inserts content into the database if it doesn't exist, summarizes it, and embeds the summary
        If any exceptions occur, the transaction will be rolled back
        '''
        try:
            if self._content_ai_exists(content.content_id):
                return None

            # Enrich the content by parsing the raw_html. If getting the html fails, default the summary_input to title
            #add in raw html to the enrich content function 
            summary_input = self._enrich_content(content.url, content.content_id, self.db, raw_html)
            if not summary_input:
                summary_input = content.title or "No title avaliable"


            # Use LLM to summarize the content
            summary, categories = self._summarize_content(summary_input) 
            if not summary: 
                raise Exception("Failed to summarize content and/or there is no title")
            
            self.ai_summary = summary
            
        

            #Now create categories that are not yet in the DB
            category_set = set()
            db = self.db
            for category_name in categories:
                # get the first element's name from the list of tuples

                if category_name.strip() != '':

                    exists = db.query(Category).filter(Category.category_name == category_name).first()

                    if exists:
                        category_set.add(exists.category_id)
                        continue

                    utc_time = datetime.now(timezone.utc)

                    new_category = Category(
                        category_id=uuid4(),
                        category_name=category_name,
                        created_at=utc_time,
                        date_modified=utc_time
                    )

                    db.add(new_category)
                    category_set.add(new_category.category_id)

            db.flush()

            #add them to the corresponding content object

            content.categories = db.query(Category).filter(Category.category_id.in_(category_set)).all()

            # Embed the summary associated with the content ORM
            embedding = self._generate_embedding(summary)
            if not embedding: 
                raise Exception("Failed to generate embedding") 

            # Insert the summary/embedding data into the ContentAI table
            content_ai = ContentAI(
                content_id=content.content_id,
                ai_summary=summary,
                embedding=embedding
            )

            self.db.add(content_ai)
            self.db.commit()
            return content_ai
        
        
        except Exception as e:
            self.db.rollback()
            print(f"[ContentEmbeddingManager] failed to process content: {e}")
            return None
        

    def query_similar_content(self, query, user_id:UUID, start_date=None,end_date=None):
        ''' Generates a query embedding and vector search the db for related content '''
        
        query_embedding = self.embedder.embed(query["semantic_query"]) 

        cache = self.user_caches[user_id]
        cached = cache.find_similar(query_embedding)
        if cached:
            return cached["results"]

        # results = (
        #     self.db.query(ContentAI, Content, ContentItem)
        #     .join(Content, ContentAI.content_id == Content.content_id)
        #     .join(ContentItem, Content.content_id == ContentItem.content_id)
        #     .filter(ContentItem.user_id == user_id)
        # )


        # cosine_dist = Folder.folder_embedding.cosine_distance(metadataVector)
        # similarity = (1 - cosine_dist).label("similarity")

        # results = (
        #     self.db.query(Folder, similarity)
        #     .filter(Folder.user_id == user_id)
        #     .filter(Folder.bucketing_mode == True)
        #     .order_by(cosine_dist) # Nearest distance first
        #     .limit(5)
        #     .all()
        # )

        TOP_K_FETCH = 6

        query = (
            self.db.query(
                ContentAI,
                Content,
                ContentAI.embedding.l2_distance(query_embedding).label("distance"),
            )
            .join(Content, ContentAI.content_id == Content.content_id)
            .filter(
                exists()
                .where(
                    (ContentItem.user_id == user_id)
                    & (ContentItem.content_id == Content.content_id)
                )
                # .correlate(Content)
            )
            .order_by("distance")
            .limit(TOP_K_FETCH)
        )
        

        if start_date and end_date:
            query = query.filter(Content.first_saved_at.between(start_date, end_date))
            logger.info(f"Executing semantic search query with distance ordering")
        
        
        raw_results = query.all()

        if not raw_results:
            return []

        distances = [r.distance for r in raw_results]
        best_distance = distances[0]

        DISTANCE_THRESHOLD = 0.10

        filtered = [
            r for r, dist in zip(raw_results, distances)
            if dist <= best_distance + DISTANCE_THRESHOLD
        ]

        results = [(r[0], r[1]) for r in filtered]
        cache.add(query_embedding, results)

        return results


    ###############################################################################
    # HELPER METHODS
    ###############################################################################


    def _enrich_content(self, url: str, content_id: UUID, db: Session, raw_html):
        try:
            metadata = self.preprocessor.extract(raw_html)
            metadata["body_text"] = self.preprocessor.clean(metadata["body_text"])
            summary_input = self.preprocessor.build_summary_input(metadata)
            return summary_input    

        except Exception as e:
            print(f"Error enriching content from {url}: {e}")
            return None


    def _generate_embedding(self, text):
        try:
            return self.embedder.embed(text)
        except Exception as e:
            print(f"OpenAI embedding failed: {e}")
            return None
        

    def _content_ai_exists(self, content_id: UUID) -> bool:
        return self.db.query(ContentAI).filter_by(content_id=content_id).first() is not None
        
    
    
    
    
    def _summarize_content(self, summary_input):
        categories = [
            "Science & Technology",
            "Arts & Entertainment",
            "News & Politics",
            "History & Culture",
            "Health & Wellness",
            "Business & Finance",
            "Education & Learning",
            "Home & Lifestyle",
            "Nature & Environment",
            "Sports & Recreation",
        ]
        try:
            logger.info(f"Summarizing content with input: {summary_input}")
            result = self.summarizer.summarize(summary_input)
            logger.info(f"OpenRouter summarization response: {result}")
            return result
        except Exception as e:
            logger.error(f"OpenRouter summarization failed: {e}")
            return None
