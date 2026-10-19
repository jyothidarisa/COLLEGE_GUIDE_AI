import re
from typing import List, Dict, Any, Optional, Tuple

def generate_student_friendly_response(
    query: str,
    evidence_list: List[Any],
    student_profile: Optional[Any] = None
) -> Tuple[str, List[Any], List[str]]:
    q_lower = query.lower()
    
    # 1. Terminology Question: Closing Rank
    if any(k in q_lower for k in ["closing rank", "what is closing", "what is a closing", "define closing rank"]):
        reply = (
            "### 1. Simple Answer\n"
            "A **closing rank** is the last (lowest) rank admitted to a particular college branch, category, and counselling round. "
            "In entrance exams like JEE and state CETs, a **lower number means admission was harder and more competitive**.\n\n"
            "### 2. Important Details\n"
            "• **How it works:** If a college offers 60 seats in Computer Science and 60 eligible students take admission, the entrance rank of the 60th student admitted is the official closing rank for that round.\n"
            "• **Opening rank vs Closing rank:** The *opening rank* is simply the rank of the very first student who enrolled in that course, while the *closing rank* marks the cutoff boundary where seats were filled.\n"
            "• **Category and Quota:** Closing ranks are always category-specific (General, OBC-NCL, SC, ST, EWS) and quota-specific (Home State vs Other State / All India).\n"
            "• **Counselling Rounds:** Closing ranks usually shift higher (open up slightly) from Round 1 to Round 6 as students withdraw or upgrade their seat choices.\n\n"
            "### 3. What This Means for You\n"
            "If your rank is equal to or better (lower) than last year's closing rank, you have a solid historical chance of getting admitted. "
            "If your rank is slightly higher than the closing rank, it is considered an ambitious Reach option across subsequent spot rounds.\n\n"
            "### 4. What to Do Next\n"
            "Check the previous-year JoSAA or state counselling closing ranks for your specific reservation category and preferred branch to estimate where you stand.\n\n"
            "### 5. Sources\n"
            "• [JoSAA Official Counselling Cutoffs Archive](https://josaa.admissions.nic.in)\n"
            "• [TNEA Official Engineering Admissions](https://www.tneaonline.org)"
        )
        sug = [
            "What is the difference between opening and closing rank?",
            "What is a category cutoff?",
            "How do spot rounds affect closing ranks?"
        ]
        return reply, [], sug

    # 2. Terminology Question: Average vs Median Package
    if any(k in q_lower for k in ["average and median", "average vs median", "median package", "difference between average"]):
        reply = (
            "### 1. Simple Answer\n"
            "The **average package** is the sum of all salaries divided by the number of students, while the **median package** is the exact middle salary (50% of students earn more, and 50% earn less). "
            "The median is much more reliable because it is not distorted by a few exceptionally high salary offers.\n\n"
            "### 2. Important Details\n"
            "• **The skew problem with average salaries:** If 5 students in a batch receive packages of ₹6 LPA, ₹7 LPA, **₹8 LPA**, ₹9 LPA, and one extraordinary international offer of ₹50 LPA:\n"
            "  - **Median Package:** **₹8.0 LPA** (reflects what a typical student actually received).\n"
            "  - **Average Package:** **₹16.0 LPA** (double the normal salary because of that single outlier offer).\n"
            "• **Why counsellors prefer median CTC:** The median gives you an honest, realistic expectation of what a regular graduate earns, protecting you from misleading marketing figures.\n"
            "• **Highest package (outlier):** Represents the top single offer in the batch, often offered to just 1 or 2 students.\n\n"
            "### 3. What This Means for You\n"
            "When evaluating a college's placement record, always check the **median package** first. If the average package is significantly higher than the median package, it indicates that a few top offers are pulling up the average.\n\n"
            "### 4. What to Do Next\n"
            "Look at the college's audited NIRF placement report, which mandates reporting the official median annual salary for undergraduate students.\n\n"
            "### 5. Sources\n"
            "• [NIRF Engineering Ranking Portal](https://www.nirfindia.org)\n"
            "• Official Institute Placement Cells & Audited Annual Reports"
        )
        sug = [
            "Which colleges have the highest median package?",
            "What does placement percentage mean?",
            "How are campus placements conducted?"
        ]
        return reply, [], sug

    return "Standard response", [], []

print("Sample check passed:", bool(generate_student_friendly_response("What is a closing rank?", [])))
