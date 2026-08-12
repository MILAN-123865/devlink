# Message Read Receipts (#237)

Message read receipts enable real-time tracking of message read status across conversations.

---

## 1. Database Model & Schema Updates

### `read_at` Timestamp
- Field added to `Message` model (`backend/app/models/message.py`):
  - `read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)`
- Populated with UTC timestamp when recipient views or marks a message as read.

### API Schemas
- `MessageResponse`:
  - Includes `read_at: Optional[datetime] = None`
- `BulkReadRequest`:
  - `message_ids: Optional[list[UUID]]`
  - `conversation_id: Optional[UUID]`
- `BulkReadResponse`:
  - `updated_count: int`
  - `read_at: datetime`

---

## 2. API Endpoints

### 1. Mark Single Message as Read
- **Endpoint**: `PATCH /api/messages/{message_id}/read`
- **Auth**: Required
- **Behavior**: Marks `read_at` timestamp on specified message if current user is a member of the conversation.

### 2. Bulk Mark Messages as Read
- **Endpoint**: `POST /api/messages/read/bulk`
- **Auth**: Required
- **Body**:
  ```json
  {
    "message_ids": ["uuid1", "uuid2"]
  }
  ```
- **Response**:
  ```json
  {
    "updated_count": 2,
    "read_at": "2026-08-10T18:49:00Z"
  }
  ```

### 3. Mark Entire Conversation as Read
- **Endpoint**: `POST /api/messages/conversation/{conversation_id}/read`
- **Auth**: Required
- **Response**:
  ```json
  {
    "updated_count": 5,
    "read_at": "2026-08-10T18:49:00Z"
  }
  ```

---

## 3. Access Controls & Validation

- Users can only mark messages as read in conversations where they are an active member (`ConversationMember`).
- Bulk mark as read only affects unread messages sent by **other users** (`sender_id != current_user.id`).
