import os
from pathlib import Path
from pypdf import PdfWriter

DOCS_DIR = Path(__file__).resolve().parent.parent / "data" / "documents"
os.makedirs(DOCS_DIR, exist_ok=True)

DOCUMENTS_DATA = {
    "iit_madras_admissions_and_fees.txt": """# Indian Institute of Technology Madras (IIT Madras)
Academic Year: 2024-2025
Source: https://www.iitm.ac.in/academics/btech-admissions
Authority: Joint Seat Allocation Authority (JoSAA) & IIT Madras Senate

## 1. Admission Eligibility and Examination Route
Admission to 4-year B.Tech and 5-year Dual Degree programs at IIT Madras is exclusively through the Joint Entrance Examination (JEE) Advanced, coordinated via JoSAA counselling.
- Candidates must pass Class 12 (or equivalent) with Physics, Chemistry, and Mathematics.
- Candidates must secure at least 75% aggregate marks in Class 12 board examination (65% for SC, ST, and PwD candidates) or be within the category-wise top 20 percentile of successful candidates in their respective Class 12 board examination.
- Candidates cannot gain admission to IIT Madras through state-level exams such as TNEA or solely through JEE Main.

## 2. Cutoff History & Allotment Ranks (2024 & 2023)
- Computer Science and Engineering (CSE): In 2024 JoSAA Round 6, the opening rank was 1 and closing rank was 148 for General (All India). In 2023, the closing rank was 144. For OBC-NCL candidates, the 2024 closing category rank was 65.
- Electrical Engineering: General closing rank was 854 in 2024 and 860 in 2023.
- Mechanical Engineering: General closing rank was 2,350 in 2024.

## 3. Tuition Fees and Living Expenses
- Annual Tuition Fee: INR 2,00,000 (INR 1,00,000 per semester).
- Hostel Accommodation: On-campus residence is mandatory for undergraduate students. Annual hostel seat rent and amenities charge is approximately INR 45,000.
- Mess Charges: Approximate dining charges are INR 40,000 per academic year on a monthly billing system.
- One-Time Admission and Caution Deposit: INR 10,000 (partially refundable upon course completion).
- Total Annual Estimated Expense: INR 2,85,000 for non-exempted students.

## 4. Scholarships and Fee Waivers
- 100% Tuition Fee Exemption: For all SC, ST, and PwD undergraduate students irrespective of family income.
- Economically Backward Students: 100% tuition waiver for students whose family annual income is less than INR 1,00,000.
- Partial Remission: 2/3rd (66.6%) of the tuition fee is waived for students whose family annual income is between INR 1,00,000 and INR 5,00,000.
- Institute Merit-cum-Means (MCM) Scholarship: Up to 25% of admitted students receive a full tuition waiver plus INR 1,000 per month stipend.

## 5. Placement Statistics (2023-2024)
- Overall undergraduate placement percentage: 81.7%.
- Median Annual CTC: INR 19.6 LPA.
- Average Annual CTC: INR 22.0 LPA.
- Highest Domestic Package: INR 1.31 Crore per annum.
- Key Recruiters: Google, Microsoft, Texas Instruments, Apple, Qualcomm, Goldman Sachs, Airbus, McKinsey.
""",

    "iit_bombay_admissions_and_fees.txt": """# Indian Institute of Technology Bombay (IIT Bombay)
Academic Year: 2024-2025
Source: https://www.iitb.ac.in/academic/btech
Authority: Joint Seat Allocation Authority (JoSAA) & IIT Bombay Senate

## 1. Admission Eligibility and Route
Admissions to 4-year B.Tech and B.S. programs at IIT Bombay in Powai, Mumbai, are conducted exclusively via the Joint Entrance Examination (JEE) Advanced through JoSAA counselling.
- Candidates must achieve at least 75% marks in Class 12 board examination (65% for SC/ST/PwD) or fall within the top 20 percentile of their board.
- Admissions are open to Indian nationals and OCI/PIO candidates who qualify in JEE Advanced.

## 2. Cutoff History (JoSAA All India Closing Ranks)
- Computer Science and Engineering (CSE):
  - 2024 JoSAA Round 6 Closing Rank: 68 (Opening Rank: 1).
  - 2023 JoSAA Round 6 Closing Rank: 67 (Opening Rank: 1).
  - Top 50-60 rankers in India consistently choose IIT Bombay CSE as first preference.
- Electrical Engineering (EE): Closing Rank 464 (2024).
- Mechanical Engineering (MECH): Closing Rank 1,794 (2024).

## 3. Fees and Expenses
- Annual Tuition Fee: INR 2,00,000 (INR 1,00,000 per semester) for General, EWS, and OBC-NCL students.
- Hostel Charges: INR 48,000 per year.
- Mess Charges: Approximately INR 44,000 per year.
- Caution Deposit: INR 12,000 (one-time refundable).
- Total Annual Estimate: INR 2,92,000.

## 4. Financial Assistance and Fee Waivers
- Full 100% Tuition Fee Remission for SC/ST/PwD students.
- 100% Tuition Fee Waiver for economically weaker students with annual family income below INR 1,00,000.
- 66.6% Tuition Remission for students with family income between INR 1,00,000 and INR 5,00,000.
- Institute MCM Scholarship: Free tuition + INR 1,000 per month pocket allowance.

## 5. Placement Highlights (2024)
- Placement Rate: 85.2%.
- Median CTC: INR 21.0 LPA.
- Average CTC: INR 23.5 LPA.
- Highest International Package: INR 1.68 Crore per annum.
- Key Recruiters: Jane Street, Tower Research, Google, Microsoft, Apple, Qualcomm, Goldman Sachs.
""",

    "iit_delhi_admissions_and_fees.txt": """# Indian Institute of Technology Delhi (IIT Delhi)
Academic Year: 2024-2025
Source: https://home.iitd.ac.in/btech-admissions.php
Authority: Joint Seat Allocation Authority (JoSAA) & IIT Delhi Senate

## 1. Admission Eligibility and Route
Admissions to 4-year B.Tech programs at IIT Delhi (Hauz Khas, New Delhi) are conducted solely on the basis of All India Rank in JEE Advanced through JoSAA counselling.
- Eligibility requires passing 10+2 with Physics, Chemistry, and Mathematics with minimum 75% aggregate (65% for SC/ST/PwD).

## 2. Cutoff Trends (JoSAA Round 6 All India Closing Ranks)
- Computer Science and Engineering (CSE):
  - 2024 Closing Rank: 116 (Opening Rank: 15).
  - 2023 Closing Rank: 118 (Opening Rank: 20).
- Electrical Engineering: Closing Rank 630 (2024).
- Mechanical Engineering: Closing Rank 1,820 (2024).

## 3. Tuition and Hostel Expenses
- Annual Tuition Fee: INR 2,00,000 (INR 1,00,000 per semester).
- Hostel Rent and Utilities: INR 46,000 per year.
- Mess Charges: Approximately INR 42,000 per year.
- Total Annual Estimated Expenditure: INR 2,88,000.

## 4. Scholarships and Financial Aid
- Full Tuition Remission for SC/ST/PwD students.
- 100% Tuition Waiver for students with family income below INR 1,00,000.
- 2/3rd Tuition Remission for students with family income between INR 1,00,000 and INR 5,00,000.
- Institute Merit-cum-Means Scholarships and Alumni Endowment Grants.

## 5. Placement Outcomes (2024)
- Placement Rate: 85.0%.
- Median CTC: INR 20.0 LPA.
- Average CTC: INR 22.8 LPA.
- Highest Package: INR 1.50 Crore per annum.
- Top Recruiters: Microsoft, Uber, Intel, DE Shaw, Texas Instruments, Bain & Company, Goldman Sachs.
""",

    "bits_pilani_admissions_and_fees.txt": """# Birla Institute of Technology and Science Pilani (BITS Pilani)
Academic Year: 2024-2025
Source: https://www.bitsadmission.com & https://www.bits-pilani.ac.in
Authority: Deemed University / Institution of Eminence (IoE)

## 1. Admission Eligibility and Pathway
Admissions to B.E. programs at BITS Pilani (Pilani, Goa, and Hyderabad campuses) are strictly based on merit in the computer-based entrance examination BITSAT (Birla Institute of Technology and Science Admission Test).
- CRITICAL ADMISSION NOTICE: BITS Pilani does NOT accept JEE Main or JEE Advanced ranks. Admission is exclusively through BITSAT scores (out of 390).
- Eligibility: Passed Class 12 from a recognized board with Physics, Chemistry, and Mathematics with a minimum of 75% aggregate in PCM, and at least 60% marks in each of Physics, Chemistry, and Mathematics individually.
- Board Toppers: Candidates who secure First Rank in any central or state board are given direct admission to the course of their choice without BITSAT.

## 2. BITSAT Cutoff History (Pilani Campus, Score out of 390)
- Computer Science and Engineering (CSE):
  - 2024 Final Iteration Cutoff: 331 marks.
  - 2023 Final Iteration Cutoff: 331 marks.
- Electrical and Electronics Engineering (EEE): Cutoff 288 marks (2024).
- Mechanical Engineering (MECH): Cutoff 244 marks (2024).

## 3. Academic Structure and Distinct Advantages
- Zero Mandatory Attendance: Students have academic freedom to choose lecture hours and study schedules.
- Practice School (PS-I and PS-II): All students undergo 7 months of full-time paid industrial internship at top global companies, resulting in exceptionally high pre-placement offers (PPOs).
- World-Class Alumni Network: Strong presence across Silicon Valley, Wall Street, and top Indian startups.

## 4. Fee Structure & High-Value Scholarships
- Annual Tuition Fee: INR 5,41,000 (INR 2,70,500 per semester).
- Hostel & Mess Charges: INR 1,10,000 per year.
- Total Annual Estimate: INR 6,51,000.
- Merit-cum-Need (MCN) Scholarships: Awarded to ~30% of the student body. Students with family income below INR 12 LPA and good CGPA receive between 25% and 100% tuition fee waivers.
- Pure Merit Scholarships: Top 1% to 2% students get 50% to 100% tuition waivers irrespective of income.

## 5. Placement Track Record (2024)
- Placement Rate: 89.1%.
- Median CTC: INR 18.0 LPA.
- Average CTC: INR 20.2 LPA.
- Highest CTC: INR 1.33 Crore per annum.
- Top Recruiters: Google, Microsoft, Amazon, Schlumberger, Oracle, McKinsey, DE Shaw, Cisco.
""",

    "iiit_hyderabad_admissions_and_fees.txt": """# International Institute of Information Technology Hyderabad (IIIT Hyderabad)
Academic Year: 2024-2025
Source: https://ugadmissions.iiit.ac.in
Authority: Autonomous / Deemed University

## 1. Admission Modes
Admissions to 4-year B.Tech in CSE and ECE at IIIT Hyderabad are conducted primarily through:
1. JEE Main Mode: Based on All India Common Rank List (CRL) in JEE Main. Applications are submitted directly to the IIIT-H UG Admissions portal (NOT through JoSAA).
2. UGEE Mode: For 5-year Dual Degree programs via Undergraduate Engineering Entrance Examination and interview.
- Eligibility: Minimum 60% aggregate in Class 12 with PCM.

## 2. Historical Cutoffs (JEE Main CRL Mode)
- Computer Science and Engineering (CSE):
  - 2024 Closing Rank: 950 (Opening CRL: 150).
  - 2023 Closing Rank: 936 (Opening CRL: 140).
- Electronics and Communication Engineering (ECE):
  - 2024 Closing Rank: 2,100 (Opening CRL: 800).

## 3. Tuition and Accommodation Expenses
- Annual Tuition Fee: INR 4,00,000 (INR 2,00,000 per semester).
- Hostel Fee: INR 45,000 per year (mandatory on-campus accommodation).
- Mess Charges: INR 48,000 per year.
- Total Annual Estimate: INR 4,93,000.

## 4. Scholarships and Assistance
- Pratibha Merit Scholarship: Full tuition waiver for candidates admitted with JEE Main All India CRL below 1,000.
- Need-based Financial Assistance: Covers up to full tuition through institute alumni foundation.

## 5. Placement Statistics (2024)
- Placement Percentage: 95.8%.
- Median CTC: INR 30.0 LPA (among the highest in India).
- Average CTC: INR 32.0 LPA.
- Highest International Offer: INR 1.02 Crore per annum.
- Top Recruiters: Google, Meta, Apple, Microsoft, Uber, Rubrik, Nvidia, Adobe.
""",

    "nit_surathkal_admissions_and_fees.txt": """# National Institute of Technology Karnataka Surathkal (NITK Surathkal)
Academic Year: 2024-2025
Source: https://www.nitk.ac.in & https://josaa.nic.in
Authority: JoSAA / Central Seat Allocation Board (CSAB)

## 1. Admission Eligibility and Routes
Admissions to 4-year B.Tech programs at NITK Surathkal are conducted exclusively via All India Ranks in JEE Main through JoSAA and CSAB counselling.
- 50% Home State Quota (Karnataka) and 50% Other State Quota across India.
- Eligibility requires Class 12 with PCM >= 75% aggregate or top 20 percentile in board exam.

## 2. Historical Cutoffs (JEE Main JoSAA Round 6)
- Computer Science and Engineering (CSE):
  - Other State Open Quota: Closing Rank 1,984 (2024), Closing Rank 1,950 (2023).
  - Home State Open Quota: Closing Rank 3,406 (2024).
- Information Technology (IT): Other State Closing Rank 3,400 (2024).
- Electronics and Communication Engineering (ECE): Other State Closing Rank 5,100 (2024).
- Mechanical Engineering (MECH): Other State Closing Rank 14,200 (2024).

## 3. Fee Structure and Campus Living
- Annual Tuition Fee: INR 1,25,000 (INR 62,500 per semester).
- Hostel Rent and Facilities: INR 45,000 per year.
- Mess Charges: INR 40,000 per year.
- Caution Deposit: INR 10,000.
- Total Annual Estimate: INR 2,10,000.

## 4. Fee Remissions and Financial Aid
- 100% Tuition Fee Remission for SC, ST, and PwD candidates.
- 100% Tuition Waiver for students with family income under INR 1,00,000.
- 2/3rd Tuition Remission for family income between INR 1,00,000 and INR 5,00,000.

## 5. Placement Statistics (2024)
- Placement Rate: 87.1%.
- Median CTC: INR 12.8 LPA.
- Average CTC: INR 16.2 LPA.
- Highest CTC: INR 54.0 LPA.
- Top Recruiters: Microsoft, Amazon, Cisco, Wells Fargo, Goldman Sachs, Samsung, Morgan Stanley.
""",

    "nit_trichy_admissions_brochure.txt": """# National Institute of Technology Tiruchirappalli (NIT Trichy)
Academic Year: 2024-2025
Source: https://www.nitt.edu/admissions/btech
Authority: JoSAA / Central Seat Allocation Board (CSAB)

## 1. Admission Eligibility and Examination Route
Undergraduate engineering admissions to NIT Tiruchirappalli (NIT Trichy) are made strictly on the basis of All India Rank (AIR) in JEE Main through JoSAA and CSAB counselling.
- 50% of seats are reserved for Home State (Tamil Nadu) candidates.
- 50% of seats are allocated to Other State candidates across India.
- Candidates must have scored at least 75% marks in Class 12 board examination (65% for SC/ST/PwD) or be in the top 20 percentile in their respective board.

## 2. Historical Cutoffs
- Computer Science and Engineering (CSE):
  - Other State Open Quota: Closing Rank 1,520 (2024), Closing Rank 1,490 (2023).
  - Home State Open Quota: Closing Rank 4,580 (2024), Closing Rank 4,410 (2023).
- Electronics and Communication Engineering (ECE):
  - Other State Open Quota: Closing Rank 4,850 (2024).
  - Home State Open Quota: Closing Rank 9,820 (2024).
- Mechanical Engineering:
  - Other State Open Quota: Closing Rank 12,400 (2024).

## 3. Fee Structure and Hostels
- Annual Tuition Fee: INR 1,25,000 (INR 62,500 per semester).
- Hostel Seat Rent and Infrastructure Charges: INR 50,000 per year.
- Mess Advance / Charges: Approximately INR 42,000 per year.
- Caution Deposit (Refundable): INR 12,000.
- Total Annual Estimated Expenditure: INR 2,17,000.

## 4. Fee Concessions & Financial Aid
- 100% Tuition Fee Remission for SC/ST/PwD students.
- 100% Tuition Fee Remission for students with annual family income below INR 1,00,000.
- 66.6% (2/3rd) Tuition Remission for students with family income between INR 1,00,000 and INR 5,00,000.

## 5. Placements (2024)
- Placement percentage: 88.0%.
- Median CTC: INR 12.0 LPA.
- Highest CTC: INR 52.8 LPA.
- Major Recruiters: DE Shaw, Amazon, Morgan Stanley, Oracle, Cisco, Tata Motors, Larsen & Toubro.
""",

    "ceg_anna_university_tnea_guidelines.txt": """# College of Engineering Guindy (CEG), Anna University
Academic Year: 2024-2025
Source: https://www.tneaonline.org & https://ceg.annauniv.edu
Authority: Directorate of Technical Education (DoTE) Tamil Nadu

## 1. Admission Eligibility and Normalization Process
Admissions to B.E. and B.Tech programs at CEG Anna University are conducted exclusively through Tamil Nadu Engineering Admissions (TNEA) Single Window Centralized Counselling.
- No entrance exam rank is used; selection is solely based on Class 12 Higher Secondary normalized cut-off marks out of 200.
- Cutoff Formula: Mathematics score out of 100 + (Physics score out of 100 / 2) + (Chemistry score out of 100 / 2). Total Maximum Cutoff: 200.00.
- Minimum Eligibility: General Category candidates must have an aggregate of at least 45% in PCM. Backward Class (BC), MBC, SC, and ST candidates must have an aggregate of at least 40%.

## 2. Cutoff History for CEG Chennai
- Computer Science and Engineering (CSE):
  - Open Competition (OC): 199.50 (2024), 199.00 (2023).
  - Backward Class (BC): 199.00 (2024).
  - Most Backward Class (MBC): 197.50 (2024).
  - Scheduled Caste (SC): 190.00 (2024).
- Information Technology (IT): OC Cutoff 198.50 (2024), 198.00 (2023).
- Electronics and Communication Engineering (ECE): OC Cutoff 198.00 (2024).
- Mechanical Engineering (MECH): OC Cutoff 193.50 (2024).

## 3. Subsidized Tuition Fees and Accommodation
- Being a premier state government university, CEG charges heavily subsidized tuition fees:
  - Annual Tuition Fee: INR 50,000 (INR 25,000 per semester).
  - Hostel Fee: INR 35,000 per year for university residential hostels.
  - Mess Charges: Approximately INR 30,000 per year on a dividing system.
  - Total Annual Cost: Approximately INR 1,15,000.

## 4. Government Scholarships
- First Graduate Tuition Waiver: INR 25,000 per year tuition waiver for candidates who are the first in their family to graduate.
- 7.5% Government School Quota: Full fee waiver (tuition, hostel, mess, books) funded entirely by the Government of Tamil Nadu for students from government schools.
- Post-Matric SC/ST Scholarships: Full reimbursement of tuition and examination fees.

## 5. Placement Highlights
- Placed Percentage: 85.2%.
- Median Package: INR 8.5 LPA.
- Highest Package: INR 40.0 LPA.
- Top Recruiters: Cisco, SAP Labs, Zoho Corporation, Caterpillar, Hyundai, TCS, Infosys, Cognizant.
""",

    "ssn_college_of_engineering_prospectus.txt": """# SSN College of Engineering (Autonomous)
Academic Year: 2024-2025
Source: https://www.ssn.edu.in
Authority: Affiliated to Anna University, Approved by AICTE, Accredited NAAC A++

## 1. Admission Pathways
SSN College of Engineering offers admission via two official routes:
1. Government Quota (65% of seats): Allocated through TNEA Single Window Counselling based on Class 12 PCM cutoff mark out of 200.
2. Management Quota (35% of seats): Allocated on pure merit based on Class 12 PCM marks and an internal aptitude interview. No capitation fee or donation is collected.

## 2. Cutoff History (TNEA Single Window)
- Computer Science and Engineering (CSE):
  - OC Cutoff: 197.50 (2024), 197.00 (2023).
  - BC Cutoff: 196.00 (2024).
- Artificial Intelligence and Data Science (AI & DS):
  - OC Cutoff: 196.50 (2024).
- Information Technology (IT):
  - OC Cutoff: 196.00 (2024).
- Electronics and Communication Engineering (ECE):
  - OC Cutoff: 195.00 (2024).

## 3. Fee Structure and Amenities
- Annual Tuition and Institutional Fee: INR 1,50,000 per year for Government Quota admitted candidates.
- Hostel Accommodation: On-campus separate hostels for boys and girls with options for AC and Non-AC rooms. Annual hostel charge is approximately INR 90,000.
- Mess Fee: INR 50,000 per year (multicuisine vegetarian and non-vegetarian).
- Total Annual Estimate: INR 2,90,000.

## 4. SSN Trust Scholarships (Over INR 4 Crores Awarded Annually)
- Merit Scholarships: 100% scholarship for top 25 board exam rankers and TNEA college toppers.
- Rural Talent Scheme: 25 rural government school students receive 100% free education, accommodation, and stipend every year.
- Sports Scholarships: Full fee waivers for national and international athletes.

## 5. Placement Record (2023-2024)
- Placement Rate: 89.1%.
- Median CTC: INR 7.2 LPA.
- Average CTC: INR 8.9 LPA.
- Highest Domestic CTC: INR 32.0 LPA.
- Top Recruiters: Amazon, Zoho, Cognizant, Freshworks, Ford, Caterpillar, NatWest, Citi.
""",

    "psg_college_of_technology_profile.txt": """# PSG College of Technology, Coimbatore
Academic Year: 2024-2025
Source: https://www.psgtech.edu
Authority: Government Aided Autonomous College, Affiliated to Anna University

## 1. Admission Overview
Admissions to all undergraduate engineering courses at PSG College of Technology are conducted through the TNEA Single Window Counselling system based on Class 12 cut-off marks (out of 200).
- PSG offers both Government Aided programs and Self-Supporting programs.

## 2. Cutoffs (TNEA 2024 & 2023)
- Computer Science and Engineering (CSE):
  - Aided OC Cutoff: 198.50 (2024), 198.00 (2023).
  - Self-Supporting OC Cutoff: 197.50 (2024).
- Information Technology (IT): OC Cutoff 197.50 (2024).
- Electronics and Communication Engineering (ECE): OC Cutoff 196.50 (2024).
- Mechanical Engineering (MECH): OC Cutoff 192.00 (2024).

## 3. Fees and Expenses
- Government Aided Programs Tuition Fee: INR 45,000 to INR 95,000 per year.
- Self-Supporting Programs Tuition Fee: INR 1,40,000 per year.
- Hostel Charges: INR 75,000 per year.
- Mess Charges: INR 45,000 per year.
- Total Annual Estimate: INR 2,15,000 (Aided) to INR 2,60,000 (Self-Supporting).

## 4. Scholarships and Placements
- PSG Sons & Charities Merit-cum-Means Scholarships: Financial assistance from INR 25,000 to INR 50,000.
- Placement Rate: 88.1%.
- Median CTC: INR 7.5 LPA.
- Highest CTC: INR 35.0 LPA.
- Top Recruiters: Amazon, Qualcomm, Bosch, Titan, Zoho, Deloitte, Larsen & Toubro.
""",

    "vit_vellore_admissions_and_fees.txt": """# Vellore Institute of Technology (VIT Vellore)
Academic Year: 2024-2025
Source: https://vit.ac.in & https://viteee.vit.ac.in
Authority: Institution of Eminence Deemed University

## 1. Admission Route and Eligibility
Admissions to B.Tech programs at VIT Vellore are conducted solely based on rank in VITEEE (VIT Engineering Entrance Examination).
- Candidates must secure at least 60% aggregate in Physics, Chemistry, and Mathematics/Biology in Class 12.
- Fee Categories: Tuition is tiered into Category 1 through Category 5 based on VITEEE rank.
  - Category 1 Tuition: INR 1,98,000 per year.
  - Category 2 Tuition: INR 3,07,000 per year.
  - Category 3-5 Tuition: Up to INR 4,90,000 per year.

## 2. Cutoff Trends (VITEEE Ranks)
- Computer Science and Engineering (CSE): Category 1 closing rank ~7,500 (2024), ~7,200 (2023).
- Information Technology (IT): Category 1 closing rank ~11,000.
- Electronics and Communication Engineering (ECE): Category 1 closing rank ~14,500.

## 3. Living Expenses and Hostels
- Hostel Charges: INR 1,05,000 (Non-AC) to INR 1,80,000 (AC).
- Mess Charges: INR 65,000 per year (Special / Non-Veg / Veg options).
- Total Annual Estimate: INR 3,68,000 for Category 1.

## 4. Scholarships and Placements
- GV School Development Programme (GVSDP): 100% tuition waiver for central/state board toppers. Top VITEEE rankers (1-50) receive 75% fee waivers.
- Placements (2024): 87.8% placed. Median CTC: INR 9.0 LPA, Average CTC: INR 10.2 LPA, Highest Package: INR 1.02 Crore.
- Top Recruiters: Microsoft, Amazon, PayPal, Cisco, Intel, Morgan Stanley, Wipro, TCS.
"""
}

def generate_documents():
    for filename, text in DOCUMENTS_DATA.items():
        txt_path = DOCS_DIR / filename
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(text.strip())
        print(f"Created text doc: {txt_path.name}")
        
        pdf_name = filename.replace(".txt", ".pdf")
        pdf_path = DOCS_DIR / pdf_name
        
        writer = PdfWriter()
        page = writer.add_blank_page(width=612, height=792)
        writer.add_metadata({
            "/Title": filename.replace(".txt", "").replace("_", " ").title(),
            "/Author": "College Guide AI Verification Pipeline",
            "/Subject": text[:200]
        })
        with open(pdf_path, "wb") as f:
            writer.write(f)
        print(f"Created PDF doc: {pdf_path.name}")

if __name__ == "__main__":
    generate_documents()
