import os
import socket
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional
import uuid
import urllib.parse

from app.config import MONGODB_URI, MONGODB_DATABASE

logger = logging.getLogger("issuefit.database")

# In-memory / file fallback store when MongoDB is not reachable locally
class LocalFallbackCollection:
    def __init__(self, name: str):
        self.name = name
        self.docs: Dict[str, Dict[str, Any]] = {}

    def _match(self, doc: Dict[str, Any], filter_dict: Dict[str, Any]) -> bool:
        for key, value in filter_dict.items():
            if key == "_id":
                if str(doc.get("_id")) != str(value):
                    return False
            elif "." in key:
                parts = key.split(".")
                curr = doc
                for p in parts:
                    if isinstance(curr, dict) and p in curr:
                        curr = curr[p]
                    else:
                        curr = None
                        break
                if curr != value:
                    return False
            else:
                if doc.get(key) != value:
                    return False
        return True

    async def find_one(self, filter_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for doc in self.docs.values():
            if self._match(doc, filter_dict):
                return dict(doc)
        return None

    async def insert_one(self, doc: Dict[str, Any]):
        doc_copy = dict(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(uuid.uuid4())
        else:
            doc_copy["_id"] = str(doc_copy["_id"])
        self.docs[doc_copy["_id"]] = doc_copy
        class InsertResult:
            inserted_id = doc_copy["_id"]
        return InsertResult()

    async def update_one(self, filter_dict: Dict[str, Any], update_dict: Dict[str, Any]):
        class UpdateResult:
            matched_count = 0
            modified_count = 0

        target_id = None
        for doc_id, doc in self.docs.items():
            if self._match(doc, filter_dict):
                target_id = doc_id
                break

        if not target_id:
            return UpdateResult()

        target = self.docs[target_id]
        if "$set" in update_dict:
            for k, v in update_dict["$set"].items():
                if "." in k:
                    parts = k.split(".")
                    curr = target
                    for p in parts[:-1]:
                        if p not in curr or not isinstance(curr[p], dict):
                            curr[p] = {}
                        curr = curr[p]
                    curr[parts[-1]] = v
                else:
                    target[k] = v

        res = UpdateResult()
        res.matched_count = 1
        res.modified_count = 1
        return res

    async def delete_one(self, filter_dict: Dict[str, Any]):
        class DeleteResult:
            deleted_count = 0

        target_id = None
        for doc_id, doc in self.docs.items():
            if self._match(doc, filter_dict):
                target_id = doc_id
                break

        res = DeleteResult()
        if target_id and target_id in self.docs:
            del self.docs[target_id]
            res.deleted_count = 1
        return res

    async def delete_many(self, filter_dict: Dict[str, Any]):
        class DeleteResult:
            deleted_count = 0

        to_del = [doc_id for doc_id, doc in self.docs.items() if self._match(doc, filter_dict)]
        for doc_id in to_del:
            del self.docs[doc_id]

        res = DeleteResult()
        res.deleted_count = len(to_del)
        return res

    async def create_index(self, *args, **kwargs):
        return "fallback_index"


class DatabaseManager:
    def __init__(self):
        self._client = None
        self._db = None
        self._is_fallback = False
        self._fallback_collections = {
            "users": LocalFallbackCollection("users"),
            "sessions": LocalFallbackCollection("sessions"),
            "oauth_states": LocalFallbackCollection("oauth_states"),
        }

    async def init_db(self):
        # Quick non-blocking socket check to failover immediately when mongod is not reachable
        try:
            parsed = urllib.parse.urlparse(MONGODB_URI)
            host = parsed.hostname or "127.0.0.1"
            if host == "localhost":
                host = "127.0.0.1"
            port = parsed.port or 27017
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.1)
            err = s.connect_ex((host, port))
            s.close()
            if err != 0:
                logger.info("MongoDB port unreachable. Utilizing in-memory / local fallback storage.")
                self._is_fallback = True
                return
        except Exception:
            logger.info("MongoDB socket check exception. Utilizing fallback storage.")
            self._is_fallback = True
            return

        try:
            import motor.motor_asyncio
            self._client = motor.motor_asyncio.AsyncIOMotorClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=1000,
                connectTimeoutMS=1000,
            )
            await self._client.admin.command("ping")
            self._db = self._client[MONGODB_DATABASE]
            self._is_fallback = False
            logger.info(f"Connected to MongoDB at {MONGODB_URI}, database={MONGODB_DATABASE}")

            try:
                await self._db.users.create_index("identities.google.subject", sparse=True, unique=True)
                await self._db.users.create_index("identities.github.id", sparse=True, unique=True)
                await self._db.sessions.create_index("session_id", unique=True)
                await self._db.sessions.create_index("expires_at", expireAfterSeconds=0)
                await self._db.oauth_states.create_index("state", unique=True)
                await self._db.oauth_states.create_index("expires_at", expireAfterSeconds=0)
            except Exception as idx_err:
                logger.warning(f"Index creation warning: {idx_err}")

        except Exception as e:
            logger.warning(f"MongoDB connection to {MONGODB_URI} failed ({e}). Using robust fallback store.")
            self._is_fallback = True

    def get_collection(self, name: str):
        if self._is_fallback or self._db is None:
            if name not in self._fallback_collections:
                self._fallback_collections[name] = LocalFallbackCollection(name)
            return self._fallback_collections[name]
        return self._db[name]

    @property
    def users(self):
        return self.get_collection("users")

    @property
    def sessions(self):
        return self.get_collection("sessions")

    @property
    def oauth_states(self):
        return self.get_collection("oauth_states")


db = DatabaseManager()
