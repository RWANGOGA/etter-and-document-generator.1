from pydantic import BaseModel
from typing import Literal, Union, Optional
from datetime import datetime


class FieldDef(BaseModel):
    name: str
    label: str
    question: str
    required: bool = True
    multiline: bool = False

class DocumentTypeDef(BaseModel):
    id: str
    category: Literal["letter", "document"]
    displayName: str
    fields: list[FieldDef]

DOCUMENT_TYPES: dict[str, DocumentTypeDef] = {
    "letter-general": DocumentTypeDef(
        id="letter-general", category="letter", displayName="Formal Letter",
        fields=[
            FieldDef(name="senderName", label="Your Name", question="What's your full name?"),
            FieldDef(name="recipientName", label="Recipient Name", question="Who is this letter addressed to?"),
            FieldDef(name="recipientTitle", label="Recipient Title", question="What is their title or position?", required=False),
            FieldDef(name="subject", label="Subject", question="What is this letter about, in a few words?", required=False),
            FieldDef(name="body", label="Letter Body", question="Now tell me what you'd like to say.", multiline=True),
        ],
    ),
    "document-report": DocumentTypeDef(
        id="document-report", category="document", displayName="Report / Essay",
        fields=[
            FieldDef(name="title", label="Title", question="What's the title of this document?"),
            FieldDef(name="topic", label="Topic Overview", question="In a sentence or two, what is this about?", multiline=True),
            FieldDef(name="body", label="Main Content", question="Now walk me through the main content.", multiline=True),
        ],
    ),
}

def get_document_type(type_id: str) -> DocumentTypeDef:
    if type_id not in DOCUMENT_TYPES:
        raise KeyError(f"Unknown document type: {type_id}")
    return DOCUMENT_TYPES[type_id]

class LetterData(BaseModel):
    senderName: str = ""
    senderAddress: str = ""
    senderCity: str = ""
    senderEmail: str = ""
    senderPhone: str = ""
    recipientName: str = ""
    recipientTitle: str = ""
    recipientCompany: str = ""
    recipientAddress: str = ""
    recipientCity: str = ""
    date: str = ""
    subject: str = ""
    body: str = ""
    signatureData: Optional[str] = None

class LetterContent(BaseModel):
    kind: Literal["letter"]
    layout: Literal["block", "modified-block", "simplified"]
    letterType: str
    data: LetterData

class FreeformContent(BaseModel):
    kind: Literal["freeform"]
    html: str
    watermark: Optional[str] = None

DocumentContent = Union[LetterContent, FreeformContent]

class DocumentCreate(BaseModel):
    type: Literal["letter", "freeform"]
    title: str = "Untitled Document"
    content: DocumentContent

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[DocumentContent] = None

class DocumentOut(BaseModel):
    id: str
    type: str
    title: str
    createdAt: datetime
    updatedAt: datetime
    content: DocumentContent

    class Config:
        from_attributes = True
