from __future__ import annotations
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime


class GoogleIdentity(BaseModel):
    subject: str


class GitHubIdentity(BaseModel):
    id: int
    username: str
    profile_url: Optional[str] = None


class GitHubConnection(BaseModel):
    connected: bool = False
    token_encrypted: Optional[str] = None
    scopes: List[str] = Field(default_factory=lambda: ["read:user"])


class UserIdentities(BaseModel):
    google: Optional[GoogleIdentity] = None
    github: Optional[GitHubIdentity] = None


class UserModel(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    identities: UserIdentities = Field(default_factory=UserIdentities)
    github_connection: GitHubConnection = Field(default_factory=GitHubConnection)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

