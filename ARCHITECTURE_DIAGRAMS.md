# Asha — Interactive Mermaid Diagrams

These diagrams can be rendered on GitHub, VS Code (with Mermaid extension), and other tools that support Mermaid syntax.

## 1. System Architecture Diagram

```mermaid
graph TB
    subgraph Client["🖥️ Frontend (React + Vite)"]
        A["Login/Register Pages"]
        B["Main App Pages<br/>(Learn, Community, FindHelp, etc.)"]
        C["AuthContext<br/>LangContext"]
        D["API Client<br/>(axios)"]
    end

    subgraph API["🔌 API Server (Express.js)"]
        E["Auth Routes<br/>(login, register, oauth)"]
        F["Community Routes<br/>(posts, comments, likes)"]
        G["Profile Routes"]
        H["Specialists Routes"]
        I["Appointments Routes"]
        J["Routine Routes"]
        K["Middleware<br/>(JWT, CORS, Error)"]
    end

    subgraph Database["💾 PostgreSQL Database"]
        L["users"]
        M["profiles"]
        N["posts"]
        O["comments"]
        P["likes"]
        Q["specialists"]
        R["appointments"]
        S["routine"]
    end

    subgraph External["🌐 External Services"]
        T["Google OAuth"]
        U["Email Service"]
        V["Browser Speech API<br/>(AAC Tool)"]
    end

    Client -->|HTTPS| API
    API <-->|SQL| Database
    API -->|Verify| T
    API -->|Send| U
    Client -->|Use| V

    D -->|/api/*| K
    K --> E
    K --> F
    K --> G
    K --> H
    K --> I
    K --> J

    E --> L
    G --> L
    G --> M
    F --> N
    F --> O
    F --> P
    H --> Q
    I --> R
    J --> S
```

---

## 2. Authentication Flow

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Browser as 🌐 Browser
    participant Backend as 🔌 Backend
    participant DB as 💾 Database
    participant Google as 🔑 Google OAuth

    User->>Browser: Navigate to Login
    Browser->>Browser: Show Login Form
    
    alt Email + Password
        User->>Browser: Enter email & password
        Browser->>Backend: POST /api/auth/login
        Backend->>DB: Query user by email
        DB-->>Backend: User record
        Backend->>Backend: Compare password hash
        
        alt Valid credentials
            Backend->>Backend: Generate JWT
            Backend-->>Browser: {token, user}
            Browser->>Browser: Save JWT in localStorage
            Browser->>Browser: Update AuthContext
            Browser->>Browser: Redirect to home
        else Invalid
            Backend-->>Browser: Error: Invalid credentials
            Browser->>Browser: Show error message
        end
    else Google Sign-In
        User->>Browser: Click "Sign in with Google"
        Browser->>Google: Request auth code
        Google-->>Browser: Auth code
        Browser->>Backend: POST /api/auth/google-callback {code}
        Backend->>Google: Verify code + get user info
        Google-->>Backend: User email, name, google_id
        Backend->>DB: Find/create user
        DB-->>Backend: User record
        Backend->>Backend: Generate JWT
        Backend-->>Browser: {token, user}
        Browser->>Browser: Save JWT + Update AuthContext
        Browser->>Browser: Redirect to home
    end
```

---

## 3. Community Forum - Create Post Flow

```mermaid
sequenceDiagram
    participant User as 👤 Parent
    participant UI as 📱 UI
    participant API as 🔌 Backend
    participant DB as 💾 Database

    User->>UI: Type post & click Post
    UI->>UI: Validate content (not empty)
    
    alt Validation passed
        UI->>API: POST /api/posts {content, user_id}
        API->>API: Verify JWT token
        
        alt Token valid
            API->>DB: INSERT INTO posts
            DB-->>API: New post record {id, ...}
            API-->>UI: {id, content, author, timestamp}
            UI->>UI: Add post to feed (top)
            UI->>UI: Clear input field
            UI->>UI: Show success message
        else Token expired/invalid
            API-->>UI: Error 401: Unauthorized
            UI->>UI: Show error & redirect to login
        end
    else Validation failed
        UI->>UI: Show error: "Post cannot be empty"
    end
```

---

## 4. Community Forum - Like Post Flow

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant UI as 📱 UI
    participant API as 🔌 Backend
    participant DB as 💾 Database

    User->>UI: Click heart icon on post
    UI->>UI: Update optimistic UI (show liked)
    UI->>API: PUT /api/like {post_id, user_id}
    
    alt Like successful
        API->>DB: INSERT/UPDATE likes table
        DB-->>API: Like record
        API->>DB: Update posts.likes_count
        DB-->>API: New count
        API-->>UI: {likes_count, is_liked: true}
        UI->>UI: Show updated count
    else Error (e.g., already liked)
        API-->>UI: Error response
        UI->>UI: Revert optimistic UI
        UI->>UI: Show error message
    end
```

---

## 5. Appointment Booking Flow

```mermaid
sequenceDiagram
    participant User as 👤 Parent
    participant UI as 📱 UI
    participant API as 🔌 Backend
    participant DB as 💾 Database
    participant Email as 📧 Email Service

    User->>UI: Navigate to Find Help
    UI->>API: GET /api/specialists?location=...
    API->>DB: Query specialists
    DB-->>API: List of specialists
    API-->>UI: {specialists: [...]}
    UI->>UI: Display specialist list

    User->>UI: Click "Book Appointment"
    UI->>UI: Show booking modal
    User->>UI: Select date, time, add notes
    UI->>API: POST /api/appointments {specialist_id, date, notes}
    
    alt Validation passed
        API->>DB: Check specialist availability
        
        alt Slot available
            API->>DB: INSERT INTO appointments
            DB-->>API: New appointment
            API->>Email: Queue confirmation email
            API-->>UI: {appointment_id, confirmation}
            UI->>UI: Show "Booking confirmed!" alert
            UI->>UI: Redirect to profile/appointments
            Email->>Email: Send email to parent
        else Slot not available
            API-->>UI: Error: "Time slot not available"
            UI->>UI: Show error & suggest other times
        end
    else Validation failed
        API-->>UI: Error: Invalid input
    end
```

---

## 6. Daily Routine Tracker Flow

```mermaid
sequenceDiagram
    participant User as 👤 Parent
    participant UI as 📱 UI
    participant API as 🔌 Backend
    participant DB as 💾 Database

    User->>UI: Open Daily Routine page
    UI->>API: GET /api/routine?date=today
    API->>DB: SELECT routine WHERE user_id=? AND date=today
    DB-->>API: Routine record {tasks, completion_status}
    API-->>UI: {tasks, completion_status, date}
    UI->>UI: Render checklist with current state

    loop For each task
        User->>UI: Click checkbox (mark complete/incomplete)
        UI->>UI: Update local state optimistically
        UI->>UI: Update visual feedback (strikethrough, color)
    end

    User->>UI: All tasks updated
    UI->>API: PUT /api/routine {date, tasks, completion_status}
    API->>DB: UPDATE routine SET tasks=?, completion_status=?
    DB-->>API: Updated record
    API-->>UI: {completion_status, stats}
    UI->>UI: Show completion %, encouraging message
    UI->>UI: Animate progress bar
```

---

## 7. User Authentication & Context Setup

```mermaid
sequenceDiagram
    participant App as ⚛️ React App
    participant Storage as 💾 localStorage
    participant AuthCtx as 🔐 AuthContext
    participant API as 🔌 Backend
    participant Router as 🗺️ Router

    App->>App: App initializes (main.jsx)
    App->>AuthCtx: Render AuthProvider
    AuthCtx->>Storage: Check localStorage for token
    
    alt Token exists
        Storage-->>AuthCtx: JWT token
        AuthCtx->>API: GET /api/profile (with token)
        
        alt Token valid
            API-->>AuthCtx: User data {id, email, name}
            AuthCtx->>AuthCtx: Set isAuth=true, user data
            AuthCtx-->>App: Ready ✓
        else Token invalid/expired
            API-->>AuthCtx: Error 401
            AuthCtx->>Storage: Clear token
            AuthCtx->>AuthCtx: Set isAuth=false
            AuthCtx-->>App: Ready (not authenticated)
        end
    else No token
        AuthCtx->>AuthCtx: Set isAuth=false
        AuthCtx-->>App: Ready (not authenticated)
    end

    App->>App: Render LangContext Provider
    LangContext->>Storage: Check localStorage for lang
    Storage-->>LangContext: Language preference
    LangContext->>LangContext: Set language (EN or नेपाली)

    App->>Router: Render routes
    Router->>Router: Check ProtectedRoute
    
    alt Is authenticated
        Router->>Router: Show protected pages
    else Not authenticated
        Router->>Router: Redirect to /login
    end
```

---

## 8. Database Schema Diagram

```mermaid
erDiagram
    USERS {
        int id PK
        string email UK
        string password_hash
        string name
        string language_preference
        string google_id UK
        timestamp created_at
        timestamp updated_at
    }

    PROFILES {
        int id PK
        int user_id FK
        string child_name
        int child_age
        string child_autism_type
        string location
        string contact_phone
        jsonb preferences
        timestamp created_at
        timestamp updated_at
    }

    POSTS {
        int id PK
        int user_id FK
        text content
        int likes_count
        int replies_count
        timestamp created_at
        timestamp updated_at
    }

    COMMENTS {
        int id PK
        int post_id FK
        int user_id FK
        text content
        timestamp created_at
        timestamp updated_at
    }

    LIKES {
        int id PK
        int post_id FK
        int comment_id FK
        int user_id FK
        timestamp created_at
    }

    SPECIALISTS {
        int id PK
        string name
        string specialist_type
        string location
        string contact_phone
        string email
        jsonb availability
        timestamp created_at
        timestamp updated_at
    }

    APPOINTMENTS {
        int id PK
        int user_id FK
        int specialist_id FK
        timestamp appointment_date
        text notes
        string status
        timestamp created_at
        timestamp updated_at
    }

    ROUTINE {
        int id PK
        int user_id FK
        date date
        jsonb tasks
        jsonb completion_status
        timestamp completed_at
        timestamp created_at
        timestamp updated_at
    }

    USERS ||--o{ PROFILES : has
    USERS ||--o{ POSTS : creates
    USERS ||--o{ COMMENTS : writes
    USERS ||--o{ LIKES : gives
    USERS ||--o{ APPOINTMENTS : makes
    USERS ||--o{ ROUTINE : maintains
    POSTS ||--o{ COMMENTS : has
    POSTS ||--o{ LIKES : receives
    COMMENTS ||--o{ LIKES : receives
    SPECIALISTS ||--o{ APPOINTMENTS : has
```

---

## 9. State Management Flow

```mermaid
graph LR
    subgraph Storage["🖥️ Browser Storage"]
        JWT["JWT Token"]
        LANG["Language Pref"]
    end

    subgraph Contexts["⚛️ React Contexts"]
        Auth["AuthContext<br/>(isAuth, user, login, logout)"]
        Lang["LangContext<br/>(language, setLanguage)"]
    end

    subgraph Pages["📄 Pages & Components"]
        Login["Login/Register"]
        Home["Home"]
        Community["Community"]
        FindHelp["FindHelp"]
        Learn["Learn"]
        BookApp["BookAppointment"]
        Routine["DailyRoutine"]
        Profile["Profile"]
    end

    subgraph UI["🎨 UI Components"]
        Header["Header<br/>(Language Toggle)"]
        BottomNav["BottomNav<br/>(Navigation)"]
        ProtRoute["ProtectedRoute<br/>(Auth Guard)"]
    end

    Storage -->|Read/Write| Contexts
    Contexts -->|Provide State| Pages
    Contexts -->|Provide State| UI
    Pages -->|Dispatch Actions| Contexts
    UI -->|Trigger Actions| Contexts
```

---

## 10. Deployment Architecture

```mermaid
graph TB
    subgraph CDN["📦 CDN / Static Hosting"]
        ReactBuild["React Build<br/>(Vite dist/)"]
    end

    subgraph FrontendServer["🌐 Frontend Server"]
        Nginx["Nginx / Apache<br/>(Serve static files)"]
    end

    subgraph APIServer["🔌 Backend Servers"]
        LB["Load Balancer<br/>(optional)"]
        API1["Express API<br/>(Port 3001)"]
        API2["Express API<br/>(Port 3001)"]
    end

    subgraph Database["💾 Database"]
        PG["PostgreSQL<br/>(Managed or Self-hosted)"]
        Backup["Automated Backups"]
    end

    subgraph External["🌐 External Services"]
        Google["Google OAuth"]
        Email["Email Provider<br/>(SendGrid, etc)"]
    end

    User["👤 User"]
    Domain["asha-app.com"]
    APIDomain["api.asha-app.com"]

    User -->|https| Domain
    Domain --> FrontendServer
    FrontendServer --> Nginx
    Nginx --> CDN
    Nginx --> ReactBuild

    User -->|https| APIDomain
    APIDomain --> APIServer
    APIServer --> LB
    LB --> API1
    LB --> API2

    API1 -->|SQL| Database
    API2 -->|SQL| Database
    PG --> Backup

    API1 --> Google
    API1 --> Email
```

---

## 11. Component Hierarchy

```mermaid
graph TD
    App["App.jsx<br/>(Main entry)"]
    
    subgraph Providers["Providers"]
        AuthProv["AuthProvider"]
        LangProv["LangProvider"]
        Router["BrowserRouter"]
    end

    subgraph Layout["Layout Components"]
        Header["Header"]
        BottomNav["BottomNav"]
        Layout["Layout"]
    end

    subgraph Pages["Page Components"]
        Login["Login"]
        Register["Register"]
        Home["Home"]
        Learn["Learn"]
        Community["Community"]
        FindHelp["FindHelp"]
        BookApp["BookAppointment"]
        DailyRoutine["DailyRoutine"]
        AACTool["AACTool"]
        Profile["Profile"]
        DisabilityChecklist["DisabilityChecklist"]
    end

    subgraph SharedComponents["Shared Components"]
        ProtRoute["ProtectedRoute"]
        LearningModal["LearningModal"]
        Button["Button"]
        Card["Card"]
    end

    App --> Providers
    Providers --> AuthProv
    Providers --> LangProv
    Providers --> Router
    
    AuthProv --> Layout
    LangProv --> Layout
    Router --> Layout
    
    Layout --> Header
    Layout --> Pages
    Layout --> BottomNav
    
    Pages --> SharedComponents
    Header --> SharedComponents
```

---

## 12. Key Data Flows

### Registration & Profile Setup
```mermaid
graph LR
    A["Register<br/>(email, password)"] -->
    B["Create User"] -->
    C["JWT Generated"] -->
    D["Redirect to Profile"] -->
    E["Fill Child Info"] -->
    F["Save Profile<br/>(db: profiles)"] -->
    G["Redirect to Home"]
```

### Forum Interaction
```mermaid
graph LR
    A["View Posts"] -->
    B["Read Post<br/>(single)"] -->
    C["Like / Reply"] -->
    D["Update counts<br/>(posts, comments)"] -->
    E["View updated<br/>feed"]
```

### Specialist Discovery to Booking
```mermaid
graph LR
    A["Search<br/>(location, type)"] -->
    B["View Results"] -->
    C["Read Specialist<br/>Profile"] -->
    D["Check<br/>Availability"] -->
    E["Book<br/>Appointment"] -->
    F["Confirm<br/>(email)"]
```

---

## 13. Error Handling Flow

```mermaid
flowchart TD
    A["API Request"] -->
    B{Response OK?}
    
    B -->|Yes| C["Return Data"]
    B -->|No| D{Error Type?}
    
    D -->|401 Unauthorized| E["Clear JWT<br/>Redirect Login"]
    D -->|400 Bad Request| F["Show Error<br/>Message"]
    D -->|404 Not Found| G["Show Not Found<br/>Message"]
    D -->|500 Server Error| H["Log Error<br/>Show Generic<br/>Message"]
    
    C --> I["Update UI"]
    E --> I
    F --> I
    G --> I
    H --> I
```

---

## Usage Notes

- **GitHub**: These diagrams render automatically in `.md` files
- **VS Code**: Install "Markdown Preview Mermaid Support" extension
- **GitLab**: Mermaid is built-in
- **Obsidian**: Install Mermaid plugin
- **PlantUML / Draw.io**: Can import/export Mermaid syntax

