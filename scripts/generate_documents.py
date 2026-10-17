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
- Mechanical Engineering (MECH): OC Cutoff 188.00 (2024).

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
"""
}

def generate_documents():
    for filename, text in DOCUMENTS_DATA.items():
        # Save text file
        txt_path = DOCS_DIR / filename
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(text.strip())
        print(f"Created text doc: {txt_path.name}")
        
        # Save PDF file with same basename
        pdf_name = filename.replace(".txt", ".pdf")
        pdf_path = DOCS_DIR / pdf_name
        
        # Generate clean PDF using pypdf
        writer = PdfWriter()
        # Add metadata and blank page with text annotation or simple page
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
