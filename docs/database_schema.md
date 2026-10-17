# Database Schema Documentation — College Guide AI

The relational database is normalized and designed for MySQL 8.0 (with out-of-the-box SQLite compatibility for local development).

---

## 1. Entity-Relationship Diagram

```mermaid
erDiagram
    COLLEGES ||--o{ COURSES : offers
    COLLEGES ||--o{ ADMISSION_CUTOFFS : has
    COLLEGES ||--o{ FEE_DETAILS : specifies
    COLLEGES ||--o{ PLACEMENT_STATISTICS : reports
    COLLEGES ||--o{ SCHOLARSHIPS : awards
    COLLEGES ||--o{ COLLEGE_DOCUMENTS : owns
    COLLEGES ||--o{ SOURCES : verified_by
    COURSES ||--o{ ADMISSION_CUTOFFS : requires
    COLLEGE_DOCUMENTS ||--o{ DOCUMENT_CHUNKS : split_into

    COLLEGES {
        int id PK
        string code UK
        string name
        string college_type
        string state
        string city
        float campus_area_acres
        int established_year
        int nirf_rank
        string accreditation
        string official_website
        string admissions_portal_url
        text overview
        text facilities
        boolean hostel_available
        int data_freshness_year
        string last_verified_at
        string verification_status
    }

    COURSES {
        int id PK
        int college_id FK
        string course_code
        string degree
        string course_name
        int duration_years
        int total_seats
        text eligibility_criteria
        float minimum_pcm_percentage
        string primary_exam
    }

    ADMISSION_CUTOFFS {
        int id PK
        int college_id FK
        int course_id FK
        int admission_year
        string exam_route
        string category
        string quota
        string score_or_rank_type
        float opening_value
        float closing_value
        int round_number
        string source_url
        string notes
    }

    FEE_DETAILS {
        int id PK
        int college_id FK
        int course_id FK
        int academic_year
        float annual_tuition_fee
        float hostel_fee_annual
        float mess_fee_annual
        float one_time_caution_deposit
        float total_annual_estimate
        text fee_breakdown_notes
        string source_url
        string last_verified
    }

    PLACEMENT_STATISTICS {
        int id PK
        int college_id FK
        int course_id FK
        int reporting_year
        int eligible_students
        int placed_students
        float placement_percentage
        float highest_package_lpa
        float average_package_lpa
        float median_package_lpa
        text top_recruiters
        string source_report_url
        string verification_date
    }

    SCHOLARSHIPS {
        int id PK
        int college_id FK
        string scholarship_name
        text eligibility_criteria
        string award_amount_or_waiver
        string category_applicable
        string merit_or_need
        string application_url
        string source_title
    }

    COLLEGE_DOCUMENTS {
        int id PK
        int college_id FK
        string title
        string doc_type
        int academic_year
        string file_path
        string source_url
        string publication_date
        string last_verified
        string sha256_hash
        int total_chunks
    }

    DOCUMENT_CHUNKS {
        int id PK
        int document_id FK
        int college_id FK
        int chunk_index
        text chunk_text
        int page_number
        string section_heading
        int vector_id
        text metadata_json
    }

    SOURCES {
        int id PK
        int college_id FK
        string authority_name
        string source_name
        string source_type
        string url
        int academic_year
        string last_verified_date
        text notes
    }
```

---

## 2. Table Specifications & Indexes

### 1. `colleges`
- **Primary Key**: `id` (AUTO_INCREMENT)
- **Unique Key**: `code` (e.g. `IITM`, `NITT`, `CEG-0001`, `SSN-1315`)
- **Indexes**: `name`, `state`, `city`
- **Purpose**: Stores verified institutional master data, NIRF ranks, and campus facilities.

### 2. `courses`
- **Primary Key**: `id`
- **Foreign Key**: `college_id` references `colleges(id)` ON DELETE CASCADE
- **Indexes**: `college_id`, `primary_exam`
- **Purpose**: Preserves approved programs (B.Tech / B.E.), specializations (CSE, ECE, MECH, etc.), minimum Class 12 PCM percentage thresholds, and total intake.

### 3. `admission_cutoffs`
- **Primary Key**: `id`
- **Foreign Keys**: `college_id` references `colleges(id)`, `course_id` references `courses(id)`
- **Composite Index**: `idx_cutoff_lookup (college_id, course_id, admission_year, exam_route, category)`
- **Purpose**: Preserves closing cutoff marks (out of 200 for TNEA) or All India closing ranks (for JEE), counselling rounds, and direct source archive URLs.

### 4. `fee_details`
- **Primary Key**: `id`
- **Foreign Key**: `college_id` references `colleges(id)`
- **Index**: `college_id`
- **Purpose**: Tracks annual tuition fees, hostel room rent, mess charges, one-time deposits, and total annual estimated expense.

### 5. `placement_statistics`
- **Primary Key**: `id`
- **Foreign Key**: `college_id` references `colleges(id)`
- **Purpose**: Stores verified placement percentages, median CTC packages, highest packages, and top core/IT recruiters with report URLs.

### 6. `scholarships`
- **Primary Key**: `id`
- **Foreign Key**: `college_id` references `colleges(id)`
- **Purpose**: Tracks institutional and government welfare waivers (MCM, First Graduate, SC/ST, rural talent).

### 7. `college_documents` & `document_chunks`
- **Foreign Keys**: `document_id` references `college_documents(id)` ON DELETE CASCADE
- **Indexes**: `vector_id`, `document_id`, `college_id`
- **Purpose**: Stores PDF text chunks, section headings, page numbers, and vector indices synchronized with the FAISS index.

### 8. `sources`
- **Primary Key**: `id`
- **Foreign Key**: `college_id` references `colleges(id)`
- **Purpose**: Complete audit trail of all verified counselling authorities, publication years, and verification dates.
