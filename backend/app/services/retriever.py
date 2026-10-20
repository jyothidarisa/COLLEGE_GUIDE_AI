import os
import re
import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models import College, Course, AdmissionCutoff, FeeDetail, PlacementStatistic, DocumentChunk, CollegeDocument
from app.schemas import RetrievedEvidence
from app.services.ingestion import get_embedding_model, get_faiss

logger = logging.getLogger(__name__)

# Common college aliases, short-forms, and acronyms mapped to official codes
COLLEGE_ALIASES: Dict[str, List[str]] = {
    "IITM": ["iit madras", "iitm", "iit-m", "iit chennai"],
    "IITD": ["iit delhi", "iitd", "iit-d"],
    "IITB": ["iit bombay", "iitb", "iit mumbai", "iit-b", "iit powai"],
    "IITK": ["iit kanpur", "iitk", "iit-k"],
    "IITKGP": ["iit kharagpur", "iitkgp", "iit-kgp", "kharagpur"],
    "IITR": ["iit roorkee", "iitr", "roorkee"],
    "IITH": ["iit hyderabad", "iith", "iit-h"],
    "IITG": ["iit guwahati", "iitg", "guwahati"],
    "NITT": ["nit trichy", "nitt", "nit tiruchirappalli", "trichy"],
    "IIT-BHU": ["iit bhu", "iit varanasi", "bhu varanasi"],
    "BITS-P": ["bits pilani", "bits", "pilani", "bits-p"],
    "IITI": ["iit indore", "iiti"],
    "NITR": ["nit rourkela", "nitr", "rourkela"],
    "SRMIST": ["srm", "srmist", "srm university"],
    "IIT-ISM": ["iit ism", "iit dhanbad", "ism dhanbad"],
    "VIT-001": ["vit vellore", "vit", "vellore institute"],
    "NITK": ["nit surathkal", "nitk", "nit karnataka", "surathkal"],
    "JU-KOL": ["jadavpur", "jadavpur university"],
    "IITP": ["iit patna", "iitp"],
    "CEG-0001": ["ceg", "anna university", "college of engineering guindy", "guindy"],
    "NITC": ["nit calicut", "nitc", "nit kozhikode", "calicut"],
    "SOA-BBSR": ["soa", "siksha 'o' anusandhan", "soa university"],
    "AMRITA-CBE": ["amrita", "amrita vishwa vidyapeetham", "amrita coimbatore"],
    "JMI-DEL": ["jamia millia", "jmi", "jamia"],
    "IITGN": ["iit gandhinagar", "iitgn"],
    "IIT-MANDI": ["iit mandi"],
    "IITJ": ["iit jodhpur", "iitj"],
    "NITW": ["nit warangal", "nitw", "warangal"],
    "TIET": ["thapar", "tiet", "thapar institute"],
    "DTU": ["dtu", "delhi technological university", "delhi college of engineering", "dce"],
    "CU-PUNJAB": ["chandigarh university", "cu punjab"],
    "IITRPR": ["iit ropar", "iitrpr"],
    "KARE": ["kalasalingam", "kare"],
    "AMU": ["amu", "aligarh muslim university"],
    "KLEF": ["kl university", "klef", "koneru lakshmaiah"],
    "KIIT": ["kiit", "kalinga institute"],
    "AMITY": ["amity", "amity noida"],
    "IIITH": ["iiit hyderabad", "iiith", "iiit-h"],
    "IIT-BBS": ["iit bhubaneswar", "iit-bbs"],
    "SASTRA": ["sastra", "sastra university"],
    "ICT-MUM": ["ict mumbai", "institute of chemical technology", "ict"],
    "MNIT-JPR": ["mnit jaipur", "mnit", "nit jaipur"],
    "UPES": ["upes", "upes dehradun"],
    "VNIT-NGP": ["vnit nagpur", "vnit", "nit nagpur"],
    "SIMATS": ["saveetha", "simats"],
    "SIU-PUNE": ["symbiosis", "siu pune"],
    "SSN-1315": ["ssn", "ssn college of engineering"],
    "LPU": ["lpu", "lovely professional university"],
    "NIT-DGP": ["nit durgapur", "durgapur"],
    "NIT-SIL": ["nit silchar", "silchar"],
    "CHRIST-BLR": ["christ university", "christ"],
    "IIT-DH": ["iit dharwad", "iit-dh"],
    "RGIPT": ["rgipt", "rajiv gandhi institute of petroleum"],
    "SLIET": ["sliet", "sant longowal"],
    "VIGNAN": ["vignan", "vignan university"],
    "MANIT-BPL": ["manit bhopal", "manit", "nit bhopal"],
    "NIT-JSR": ["nit jamshedpur"],
    "NIT-MEGH": ["nit meghalaya"],
    "JAIN-BLR": ["jain university"],
    "NIT-KKR": ["nit kurukshetra"],
    "NIT-RPR": ["nit raipur"],
    "VELTECH": ["vel tech", "veltech"],
    "AUCE-VIZAG": ["andhra university", "auce", "andhra university college of engineering"],
    "CHITKARA": ["chitkara", "chitkara university"],
    "COEP": ["coep", "college of engineering pune", "coep technological university"],
    "SRU": ["sr university", "sru"],
    "DIAT-PUNE": ["diat pune", "diat"],
    "UIET-PU": ["uiet", "panjab university"],
    "JNTUH": ["jntuh", "jntu hyderabad"],
    "CGU-BBSR": ["cgu odisha", "cv raman", "c.v. raman"],
    "IIITM-GWL": ["iiitm gwalior", "abv-iiitm"],
    "NIT-HMR": ["nit hamirpur"],
    "PDEU": ["pdeu", "pandit deendayal"],
    "NIT-PY": ["nit puducherry"],
    "SKCET": ["skcet", "sri krishna college"]
}


def detect_colleges_in_query(db: Session, query_text: str) -> List[College]:
    """Detects specific colleges mentioned in the user's message using aliases and codes."""
    q_lower = query_text.lower()
    all_colleges = {c.code: c for c in db.query(College).all()}
    detected = []
    seen_ids = set()

    for code, aliases in COLLEGE_ALIASES.items():
        if code in all_colleges and all_colleges[code].id not in seen_ids:
            for alias in aliases:
                # Use word boundaries so that e.g. "vit" doesn't match inside "activity"
                pattern = r"(?<!\w)" + re.escape(alias) + r"(?!\w)"
                if re.search(pattern, q_lower):
                    detected.append(all_colleges[code])
                    seen_ids.add(all_colleges[code].id)
                    break

    # Also check full names and codes of any colleges not caught by aliases
    if not detected:
        for c in all_colleges.values():
            if c.id not in seen_ids:
                code_lower = c.code.lower()
                name_lower = c.name.lower()
                if (re.search(r"(?<!\w)" + re.escape(code_lower) + r"(?!\w)", q_lower) or
                    (len(name_lower) > 5 and name_lower in q_lower)):
                    detected.append(c)
                    seen_ids.add(c.id)

    return detected


def query_mentions_unknown_institution(query_text: str, detected_colleges: List[College]) -> bool:
    """
    Detects if the query asks about a specific named college or institution
    that is absent from the verified database (e.g. 'Atlantis Institute', 'Hogwarts University').
    """
    if detected_colleges:
        return False
    q_lower = query_text.lower()
    patterns = [
        r'\b(?:at|for|in|of|about)\s+([a-z\s]+?\s*(?:institute|university|college|academy|campus|school))\b',
        r'\b([a-z\s]+?\s*(?:institute|university|college|academy)\s+of\s+[a-z\s]+)\b'
    ]
    for p in patterns:
        m = re.search(p, q_lower)
        if m:
            matched_name = m.group(1).strip()
            generic = [
                "engineering college", "good college", "this college", "that college",
                "government college", "private college", "reach college", "target college",
                "safer college", "top college", "best college", "which college", "any college",
                "btech college", "engineering colleges", "target colleges", "reach colleges"
            ]
            if len(matched_name.split()) >= 2 and matched_name not in generic:
                return True
    return False


def retrieve_structured_evidence(
    db: Session,
    query_text: str,
    college_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Performs targeted SQL lookup for numerical facts (fees, cutoffs, placements).
    Filters strictly to colleges mentioned in query to prevent irrelevant dumps.
    """
    q_lower = query_text.lower()
    structured_snippets = []

    # 1. Determine target colleges
    target_colleges = []
    if college_id:
        col = db.query(College).filter(College.id == college_id).first()
        if col:
            target_colleges = [col]
    else:
        target_colleges = detect_colleges_in_query(db, query_text)

    # If the user specifically queried a named institution that is NOT in the database, return empty
    if not target_colleges and query_mentions_unknown_institution(query_text, target_colleges):
        return []

    target_ids = [c.id for c in target_colleges]

    # Check for general terminology questions (e.g. "what is closing rank")
    is_terminology_query = any(k in q_lower for k in [
        "what is closing rank", "what is a closing rank", "define closing rank",
        "opening rank vs closing rank", "difference between average and median",
        "average vs median", "what is percentile", "what is category cutoff"
    ])
    if is_terminology_query and not target_colleges:
        # For general terminology questions with no college mentioned, do NOT dump random college facts
        return []

    # 2. Check for Fee Queries
    is_fee_query = any(k in q_lower for k in [
        "fee", "tuition", "cost", "budget", "hostel charge", "mess", "expensive", "affordable", "cheapest"
    ])
    if is_fee_query:
        q = db.query(FeeDetail, College).join(College, FeeDetail.college_id == College.id)
        if target_ids:
            q = q.filter(FeeDetail.college_id.in_(target_ids))
        else:
            # Check if budget is specified (e.g. "budget of 2 lakhs")
            budget_match = re.search(r'(\d+)\s*(?:lakh|lac|lpa)', q_lower)
            if budget_match:
                try:
                    budget_val = float(budget_match.group(1)) * 100000.0
                    q = q.filter(FeeDetail.annual_tuition_fee <= budget_val)
                except Exception:
                    pass
            q = q.order_by(FeeDetail.annual_tuition_fee.asc())

        fee_records = q.order_by(FeeDetail.academic_year.desc()).limit(4).all()
        for f, c in fee_records:
            hostel_str = f"₹{f.hostel_fee_annual:,.0f}/year" if f.hostel_fee_annual else "Included/Standard"
            text = (
                f"College: {c.name} ({c.code}) | Year: {f.academic_year} | "
                f"Annual Tuition Fee: ₹{f.annual_tuition_fee:,.0f} | "
                f"Hostel Living Cost: {hostel_str} | "
                f"Total Estimated Annual Expense: ₹{f.total_annual_estimate:,.0f} | "
                f"Breakdown Details: {f.fee_breakdown_notes or 'Standard regulatory fee schedule'}."
            )
            structured_snippets.append({
                "chunk_id": -f.id,
                "college_name": c.name,
                "document_title": f"Official Fee Schedule {f.academic_year}",
                "source_url": f.source_url,
                "page_number": 1,
                "academic_year": f.academic_year,
                "snippet": text,
                "relevance_score": 0.98
            })

    # 3. Check for Cutoff Queries
    is_cutoff_query = any(k in q_lower for k in [
        "cutoff", "cut-off", "rank", "mark", "closing rank", "percentile", "score", "chance", "admit", "eligib"
    ])
    if is_cutoff_query:
        q = db.query(AdmissionCutoff, College, Course).join(
            College, AdmissionCutoff.college_id == College.id
        ).join(
            Course, AdmissionCutoff.course_id == Course.id
        )
        if target_ids:
            q = q.filter(AdmissionCutoff.college_id.in_(target_ids))

        # Check course specialization hints
        if "cse" in q_lower or "computer" in q_lower:
            q = q.filter(Course.course_code == "CSE")
        elif "ece" in q_lower or "electronic" in q_lower:
            q = q.filter(Course.course_code == "ECE")
        elif "mech" in q_lower:
            q = q.filter(Course.course_code == "MECH")
        elif "civil" in q_lower:
            q = q.filter(Course.course_code == "CIVIL")

        cutoffs = q.order_by(AdmissionCutoff.admission_year.desc()).limit(6).all()
        for cut, c, crs in cutoffs:
            text = (
                f"College: {c.name} ({c.code}) | Program: {crs.course_name} ({crs.course_code}) | "
                f"Year: {cut.admission_year} | Exam Route: {cut.exam_route} | "
                f"Category: {cut.category} ({cut.quota}) | "
                f"{cut.score_or_rank_type} Closing: {cut.closing_value:.2f} (Round {cut.round_number}) | "
                f"Notes: {cut.notes or 'Official historical closing cutoff'}."
            )
            structured_snippets.append({
                "chunk_id": -100 - cut.id,
                "college_name": c.name,
                "document_title": f"Official Cutoff Archive {cut.admission_year}",
                "source_url": cut.source_url,
                "page_number": 1,
                "academic_year": cut.admission_year,
                "snippet": text,
                "relevance_score": 0.96
            })

    # 4. Check for Placement Queries
    is_placement_query = any(k in q_lower for k in [
        "placement", "package", "salary", "recruiter", "highest", "median", "average", "ctc", "job"
    ])
    if is_placement_query:
        q = db.query(PlacementStatistic, College).join(College, PlacementStatistic.college_id == College.id)
        if target_ids:
            q = q.filter(PlacementStatistic.college_id.in_(target_ids))
        else:
            q = q.order_by(PlacementStatistic.median_package_lpa.desc())

        placements = q.order_by(PlacementStatistic.reporting_year.desc()).limit(4).all()
        for p, c in placements:
            text = (
                f"College: {c.name} ({c.code}) | Year: {p.reporting_year} | "
                f"Placement Rate: {p.placement_percentage}% | "
                f"Median Package: ₹{p.median_package_lpa} LPA | "
                f"Highest Package: ₹{p.highest_package_lpa} LPA | "
                f"Average Package: ₹{p.average_package_lpa} LPA | "
                f"Top Recruiters: {p.top_recruiters}."
            )
            structured_snippets.append({
                "chunk_id": -200 - p.id,
                "college_name": c.name,
                "document_title": f"Audited Placement Report {p.reporting_year}",
                "source_url": p.source_report_url,
                "page_number": 1,
                "academic_year": p.reporting_year,
                "snippet": text,
                "relevance_score": 0.95
            })

    return structured_snippets


def retrieve_vector_evidence(
    db: Session,
    query_text: str,
    top_k: int = 5,
    college_id: Optional[int] = None
) -> List[RetrievedEvidence]:
    """
    Retrieves semantically relevant document chunks using FAISS cosine similarity.
    Filters by detected colleges when mentioned.
    """
    faiss = get_faiss()
    model = get_embedding_model()
    index_file = os.path.join(settings.FAISS_INDEX_DIR, "vector_index.faiss")
    meta_file = os.path.join(settings.FAISS_INDEX_DIR, "chunks_metadata.json")

    results: List[RetrievedEvidence] = []

    # Detect mentioned colleges
    target_colleges = []
    if college_id:
        target_ids = {college_id}
    else:
        detected = detect_colleges_in_query(db, query_text)
        if not detected and query_mentions_unknown_institution(query_text, detected):
            return []
        target_ids = {c.id for c in detected} if detected else set()

    if model is not None and faiss is not None and os.path.exists(index_file) and os.path.exists(meta_file):
        try:
            import numpy as np
            index = faiss.read_index(index_file)
            with open(meta_file, "r", encoding="utf-8") as f:
                metadata = json.load(f)

            # Detect topic intent to prioritize relevant sections
            q_lower_v = query_text.lower()
            topic_priorities = []
            if any(w in q_lower_v for w in ["hostel", "room", "mess", "food", "dining", "accommodation"]):
                topic_priorities.append("hostels")
            if any(w in q_lower_v for w in ["scholarship", "financial aid", "waiver", "studentship"]):
                topic_priorities.append("scholarships")
            if any(w in q_lower_v for w in ["fee", "tuition", "cost", "charge", "expense"]):
                topic_priorities.append("fees")
            if any(w in q_lower_v for w in ["placement", "recruiter", "package", "salary", "ctc"]):
                topic_priorities.append("placements")
            if any(w in q_lower_v for w in ["admission", "eligibility", "entrance", "exam", "josaa", "tnea", "cutoff"]):
                topic_priorities.append("admissions")
            if any(w in q_lower_v for w in ["campus", "railway", "station", "bus", "library", "gym", "connectivity", "safety"]):
                topic_priorities.append("campus")

            q_emb = model.encode([query_text], convert_to_numpy=True, normalize_embeddings=True)
            search_k = min(top_k * 5, index.ntotal)
            distances, indices = index.search(q_emb.astype("float32"), search_k)

            seen_snippets = set()

            for dist, idx in zip(distances[0], indices[0]):
                if idx < 0 or idx >= len(metadata):
                    continue
                meta = metadata[idx]
                chunk_col_id = meta.get("college_id")

                # If specific colleges were detected, strictly filter to them
                if target_ids and chunk_col_id not in target_ids:
                    continue

                # Relevance threshold filter
                base_score = float(dist)
                if base_score < 0.28:
                    continue

                # Topic-based boost
                chunk_topics = meta.get("topic_tags", [])
                boost = 0.0
                if any(t in chunk_topics for t in topic_priorities):
                    boost += 0.12

                final_score = round(min(0.99, base_score + boost), 3)

                # Deduplicate near-identical snippets
                snip_sig = meta["text"][:80].strip()
                if snip_sig in seen_snippets:
                    continue
                seen_snippets.add(snip_sig)

                col_name = meta.get("college_name")
                if not col_name and chunk_col_id:
                    col = db.query(College).filter(College.id == chunk_col_id).first()
                    if col:
                        col_name = col.name

                sec_heading = meta.get("section_heading", "")
                base_title = meta.get("title", "Official College Document")
                full_title = f"{base_title} ({sec_heading})" if sec_heading and sec_heading not in base_title else base_title

                results.append(RetrievedEvidence(
                    chunk_id=meta.get("chunk_id", idx),
                    college_name=col_name,
                    document_title=full_title,
                    source_url=meta.get("source_url", ""),
                    page_number=meta.get("page_number", 1),
                    academic_year=meta.get("academic_year", 2024),
                    snippet=meta["text"][:700],
                    relevance_score=final_score
                ))
                if len(results) >= top_k:
                    break
        except Exception as e:
            logger.warning(f"Error querying FAISS vector index: {e}")

    # Fallback keyword matching over DB chunks if vector results are empty
    if len(results) < top_k:
        words = [w.strip() for w in query_text.lower().split() if len(w.strip()) > 3]
        q = db.query(DocumentChunk, CollegeDocument, College).join(
            CollegeDocument, DocumentChunk.document_id == CollegeDocument.id
        ).outerjoin(
            College, DocumentChunk.college_id == College.id
        )
        if target_ids:
            q = q.filter(DocumentChunk.college_id.in_(list(target_ids)))

        candidates = q.limit(20).all()
        for chunk, doc, col in candidates:
            text_lower = chunk.chunk_text.lower()
            matches = sum(1 for w in words if w in text_lower)
            if matches > 0 and not any(r.chunk_id == chunk.id for r in results):
                score = round(min(0.9, 0.4 + (matches * 0.15)), 2)
                results.append(RetrievedEvidence(
                    chunk_id=chunk.id,
                    college_name=col.name if col else None,
                    document_title=doc.title,
                    source_url=doc.source_url,
                    page_number=chunk.page_number or 1,
                    academic_year=doc.academic_year,
                    snippet=chunk.chunk_text[:600],
                    relevance_score=score
                ))
                if len(results) >= top_k:
                    break

    results.sort(key=lambda r: r.relevance_score, reverse=True)
    return results[:top_k]


def hybrid_retrieve(
    db: Session,
    query_text: str,
    top_k: int = 5,
    college_id: Optional[int] = None
) -> List[RetrievedEvidence]:
    """
    Combines exact SQL structured records with semantic vector retrieval.
    Filters specifically to colleges in the query and avoids irrelevant documents.
    """
    structured_records = retrieve_structured_evidence(db, query_text, college_id=college_id)
    vector_records = retrieve_vector_evidence(db, query_text, top_k=top_k, college_id=college_id)

    combined: List[RetrievedEvidence] = []

    # Add structured records first
    for sr in structured_records:
        combined.append(RetrievedEvidence(
            chunk_id=sr["chunk_id"],
            college_name=sr.get("college_name"),
            document_title=sr["document_title"],
            source_url=sr["source_url"],
            page_number=sr.get("page_number", 1),
            academic_year=sr.get("academic_year"),
            snippet=sr["snippet"],
            relevance_score=sr["relevance_score"]
        ))

    # Append semantic vector records (avoid duplicates)
    for vr in vector_records:
        if not any(c.document_title == vr.document_title and c.snippet[:60] == vr.snippet[:60] for c in combined):
            combined.append(vr)

    return combined[:top_k + len(structured_records)]
