-- College Guide AI MySQL Database Schema
-- Version: 1.0.0
-- Character set: utf8mb4

CREATE DATABASE IF NOT EXISTS college_guide_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE college_guide_ai;

-- 1. Colleges Table
CREATE TABLE IF NOT EXISTS colleges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    college_type VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    campus_area_acres FLOAT NULL,
    established_year INT NULL,
    nirf_rank INT NULL,
    accreditation VARCHAR(100) NULL,
    official_website VARCHAR(255) NOT NULL,
    admissions_portal_url VARCHAR(255) NULL,
    overview TEXT NULL,
    facilities TEXT NULL,
    hostel_available BOOLEAN DEFAULT TRUE,
    data_freshness_year INT DEFAULT 2024,
    last_verified_at VARCHAR(50) NULL,
    verification_status VARCHAR(50) DEFAULT 'Verified Official',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_colleges_name (name),
    INDEX idx_colleges_state (state),
    INDEX idx_colleges_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    degree VARCHAR(50) DEFAULT 'B.Tech',
    course_name VARCHAR(255) NOT NULL,
    duration_years INT DEFAULT 4,
    total_seats INT NULL,
    eligibility_criteria TEXT NULL,
    minimum_pcm_percentage FLOAT DEFAULT 60.0,
    primary_exam VARCHAR(50) NOT NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    INDEX idx_courses_college_id (college_id),
    INDEX idx_courses_exam (primary_exam)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Admission Cutoffs Table
CREATE TABLE IF NOT EXISTS admission_cutoffs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    course_id INT NOT NULL,
    admission_year INT NOT NULL,
    exam_route VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    quota VARCHAR(50) DEFAULT 'General',
    score_or_rank_type VARCHAR(100) NOT NULL,
    opening_value FLOAT NULL,
    closing_value FLOAT NOT NULL,
    round_number INT DEFAULT 1,
    source_url VARCHAR(500) NOT NULL,
    notes VARCHAR(255) NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_cutoff_lookup (college_id, course_id, admission_year, exam_route, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Fee Details Table
CREATE TABLE IF NOT EXISTS fee_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    course_id INT NULL,
    academic_year INT NOT NULL,
    annual_tuition_fee FLOAT NOT NULL,
    hostel_fee_annual FLOAT NULL,
    mess_fee_annual FLOAT NULL,
    one_time_caution_deposit FLOAT NULL,
    total_annual_estimate FLOAT NOT NULL,
    fee_breakdown_notes TEXT NULL,
    source_url VARCHAR(500) NOT NULL,
    last_verified VARCHAR(50) NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    INDEX idx_fees_college_id (college_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Placement Statistics Table
CREATE TABLE IF NOT EXISTS placement_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    course_id INT NULL,
    reporting_year INT NOT NULL,
    eligible_students INT NULL,
    placed_students INT NULL,
    placement_percentage FLOAT NULL,
    highest_package_lpa FLOAT NULL,
    average_package_lpa FLOAT NULL,
    median_package_lpa FLOAT NULL,
    top_recruiters TEXT NULL,
    source_report_url VARCHAR(500) NOT NULL,
    verification_date VARCHAR(50) NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    INDEX idx_placements_college_id (college_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Scholarships Table
CREATE TABLE IF NOT EXISTS scholarships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NULL,
    scholarship_name VARCHAR(255) NOT NULL,
    eligibility_criteria TEXT NOT NULL,
    award_amount_or_waiver VARCHAR(255) NOT NULL,
    category_applicable VARCHAR(100) NULL,
    merit_or_need VARCHAR(50) DEFAULT 'Merit',
    application_url VARCHAR(500) NULL,
    source_title VARCHAR(255) NOT NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
    INDEX idx_scholarships_college_id (college_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. College Documents Table
CREATE TABLE IF NOT EXISTS college_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NULL,
    title VARCHAR(255) NOT NULL,
    doc_type VARCHAR(100) NOT NULL,
    academic_year INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    source_url VARCHAR(500) NOT NULL,
    publication_date VARCHAR(50) NULL,
    last_verified VARCHAR(50) NULL,
    sha256_hash VARCHAR(64) NULL,
    total_chunks INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    INDEX idx_docs_college_id (college_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Document Chunks Table
CREATE TABLE IF NOT EXISTS document_chunks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    college_id INT NULL,
    chunk_index INT NOT NULL,
    chunk_text TEXT NOT NULL,
    page_number INT NULL,
    section_heading VARCHAR(255) NULL,
    vector_id INT NULL,
    metadata_json TEXT NULL,
    FOREIGN KEY (document_id) REFERENCES college_documents(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    INDEX idx_chunks_document_id (document_id),
    INDEX idx_chunks_college_id (college_id),
    INDEX idx_chunks_vector_id (vector_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Sources Table
CREATE TABLE IF NOT EXISTS sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NULL,
    authority_name VARCHAR(255) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    academic_year INT NOT NULL,
    last_verified_date VARCHAR(50) NOT NULL,
    notes TEXT NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
    INDEX idx_sources_college_id (college_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
