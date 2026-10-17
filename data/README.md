# Verified College Admissions Dataset

This directory contains verified datasets for Indian engineering college admissions (B.Tech / B.E.) covering TNEA (Tamil Nadu Engineering Admissions), JEE Main, JEE Advanced, and autonomous universities.

## Dataset Files

1. `colleges.csv`
   - Master list of colleges, NIRF ranks (2024), affiliations, accreditations (NAAC/NBA), campus area, hostel availability, official portals, and verification dates.
   - **Zero Fabricated Records**: Only verified, publicly accredited institutions (e.g. IIT Madras, NIT Trichy, Anna University CEG, PSG College of Technology, SSN College of Engineering, TCE Madurai, CIT Coimbatore, VIT Vellore).

2. `courses.csv`
   - Approved courses, degree types (B.Tech / B.E.), primary entrance examinations (TNEA, JEE Main, JEE Advanced, VITEEE), minimum Class 12 PCM percentages, and approved seat intakes.

3. `cutoffs.csv`
   - Official historical closing cutoffs across rounds for 2024 and 2023.
   - Supports TNEA normalized marks out of 200 (formula: Maths + Phy/2 + Chem/2) and JEE All India Ranks.
   - Preserves categories: OC, BC, MBC, SC, ST, GEN, OBC-NCL, EWS and quotas (Home State vs Other State).

4. `fees.csv`
   - Audited annual tuition fees, hostel seat rent, mess charges, and total annual expense estimates for Academic Year 2024-2025.

5. `placements.csv`
   - Audited placement statistics: eligible vs placed student counts, placement percentages, median CTC packages, highest domestic packages, and top recruiters.

6. `scholarships.csv`
   - Verified institutional, state, and merit-cum-means (MCM) scholarships, eligibility thresholds, and tuition waiver benefits.

7. `sources.csv`
   - Tracking table for all primary authorities (Directorate of Technical Education TN, JoSAA, Ministry of Education NIRF) with direct URLs and verification timestamps.

8. `documents/`
   - Official brochures, admission handbooks, and placement reports in `.pdf` and `.txt` format used for RAG text extraction and vector embedding in FAISS.
