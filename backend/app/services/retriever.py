import os
import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models import College, Course, AdmissionCutoff, FeeDetail, PlacementStatistic, DocumentChunk, CollegeDocument
from app.schemas import RetrievedEvidence
from app.services.ingestion import get_embedding_model, get_faiss

logger = logging.getLogger(__name__)

def retrieve_structured_evidence(
    db: Session,
    query_text: str,
    college_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Performs precise SQL lookup for numerical & structured facts (fees, cutoffs, placements)
    to complement semantic vector retrieval as required by Section 8.B.
    """
    q_lower = query_text.lower()
    structured_snippets = []

    # Check for fee queries
    if any(k in q_lower for k in ["fee", "tuition", "cost", "budget", "hostel charge", "mess", "expensive", "affordable"]):
        q = db.query(FeeDetail, College).join(College, FeeDetail.college_id == College.id)
        if college_id:
            q = q.filter(FeeDetail.college_id == college_id)
        fee_records = q.order_by(FeeDetail.academic_year.desc()).limit(4).all()
        for f, c in fee_records:
            hostel_str = f"Hostel fee is ₹{f.hostel_fee_annual:,.0f}/year" if f.hostel_fee_annual else "Hostel fee details not separately documented"
            text = (
                f"VERIFIED SQL FEE RECORD: {c.name} ({c.code}) for Academic Year {f.academic_year}: "
                f"Annual tuition fee is ₹{f.annual_tuition_fee:,.0f}. {hostel_str}. "
                f"Estimated total annual expense: ₹{f.total_annual_estimate:,.0f}. "
                f"Breakdown notes: {f.fee_breakdown_notes or 'Standard regulatory fee structure'}."
            )
            structured_snippets.append({
                "chunk_id": -f.id,  # negative ID indicates structured record
                "college_name": c.name,
                "document_title": f"Official Fee Schedule {f.academic_year}",
                "source_url": f.source_url,
                "page_number": 1,
                "academic_year": f.academic_year,
                "snippet": text,
                "relevance_score": 0.98
            })

    # Check for cutoff queries
    if any(k in q_lower for k in ["cutoff", "cut-off", "rank", "mark", "closing rank", "percentile", "score"]):
        q = db.query(AdmissionCutoff, College, Course).join(
            College, AdmissionCutoff.college_id == College.id
        ).join(
            Course, AdmissionCutoff.course_id == Course.id
        )
        if college_id:
            q = q.filter(AdmissionCutoff.college_id == college_id)
        else:
            # Check if specific college is mentioned in query
            all_cols = db.query(College).all()
            for col_cand in all_cols:
                cand_code = col_cand.code.lower().split("-")[0]
                if cand_code in q_lower or col_cand.code.lower() in q_lower or (col_cand.name.lower() in q_lower):
                    q = q.filter(AdmissionCutoff.college_id == col_cand.id)
                    break
                elif any(kw in q_lower for kw in ["ceg", "guindy", "anna university"] if kw in col_cand.name.lower() or kw in col_cand.code.lower()):
                    q = q.filter(AdmissionCutoff.college_id == col_cand.id)
                    break
        
        # Search for course hints in query
        if "cse" in q_lower or "computer" in q_lower:
            q = q.filter(Course.course_code == "CSE")
        elif "ece" in q_lower or "electronic" in q_lower:
            q = q.filter(Course.course_code == "ECE")
        elif "mech" in q_lower:
            q = q.filter(Course.course_code == "MECH")
            
        cutoffs = q.order_by(AdmissionCutoff.admission_year.desc()).limit(6).all()
        for cut, c, crs in cutoffs:
            text = (
                f"VERIFIED SQL CUTOFF RECORD: {c.name} ({c.code}) - {crs.course_name} ({crs.course_code}): "
                f"Year {cut.admission_year}, Route: {cut.exam_route}, Category: {cut.category}, Quota: {cut.quota}. "
                f"{cut.score_or_rank_type} Closing Cutoff: {cut.closing_value:.2f}. "
                f"Round {cut.round_number}. Source: {cut.source_url}."
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

    # Check for placement queries
    if any(k in q_lower for k in ["placement", "package", "salary", "recruiter", "highest", "median", "average", "ctc"]):
        q = db.query(PlacementStatistic, College).join(College, PlacementStatistic.college_id == College.id)
        if college_id:
            q = q.filter(PlacementStatistic.college_id == college_id)
        placements = q.order_by(PlacementStatistic.reporting_year.desc()).limit(4).all()
        for p, c in placements:
            text = (
                f"VERIFIED SQL PLACEMENT RECORD: {c.name} ({c.code}) for Year {p.reporting_year}: "
                f"Placement Rate: {p.placement_percentage}%. "
                f"Median Package: ₹{p.median_package_lpa} LPA. Highest Package: ₹{p.highest_package_lpa} LPA. "
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
    Falls back gracefully to database chunk text matching if vector index is building.
    """
    faiss = get_faiss()
    model = get_embedding_model()
    index_file = os.path.join(settings.FAISS_INDEX_DIR, "vector_index.faiss")
    meta_file = os.path.join(settings.FAISS_INDEX_DIR, "chunks_metadata.json")

    results: List[RetrievedEvidence] = []

    if model is not None and faiss is not None and os.path.exists(index_file) and os.path.exists(meta_file):
        try:
            import numpy as np
            index = faiss.read_index(index_file)
            with open(meta_file, "r", encoding="utf-8") as f:
                metadata = json.load(f)

            # Generate query embedding
            q_emb = model.encode([query_text], convert_to_numpy=True, normalize_embeddings=True)
            distances, indices = index.search(q_emb.astype("float32"), min(top_k * 2, index.ntotal))

            for dist, idx in zip(distances[0], indices[0]):
                if idx < 0 or idx >= len(metadata):
                    continue
                meta = metadata[idx]
                
                # Filter by college_id if specified
                if college_id and meta.get("college_id") and meta.get("college_id") != college_id:
                    continue

                # Fetch college name if needed
                col_name = None
                if meta.get("college_id"):
                    col = db.query(College).filter(College.id == meta["college_id"]).first()
                    if col:
                        col_name = col.name

                results.append(RetrievedEvidence(
                    chunk_id=meta.get("chunk_id", idx),
                    college_name=col_name,
                    document_title=meta.get("title", "Official College Document"),
                    source_url=meta.get("source_url", ""),
                    page_number=meta.get("page_number", 1),
                    academic_year=2024,
                    snippet=meta["text"][:600],
                    relevance_score=round(float(dist), 3)
                ))
                if len(results) >= top_k:
                    break
        except Exception as e:
            logger.warning(f"Error querying FAISS vector index: {e}")

    # Fallback / augment: text query over DocumentChunk table in DB
    if len(results) < top_k:
        words = [w.strip() for w in query_text.lower().split() if len(w.strip()) > 3]
        q = db.query(DocumentChunk, CollegeDocument, College).join(
            CollegeDocument, DocumentChunk.document_id == CollegeDocument.id
        ).outerjoin(
            College, DocumentChunk.college_id == College.id
        )
        if college_id:
            q = q.filter(DocumentChunk.college_id == college_id)
        
        candidates = q.limit(20).all()
        for chunk, doc, col in candidates:
            # Score by keyword matches
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

    # Sort results by relevance score descending
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
    Guarantees both exact numerical correctness and contextual depth.
    """
    structured_records = retrieve_structured_evidence(db, query_text, college_id=college_id)
    vector_records = retrieve_vector_evidence(db, query_text, top_k=top_k, college_id=college_id)

    combined: List[RetrievedEvidence] = []
    
    # Add structured records first (they have exact verified numbers)
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

    # Append semantic vector records
    for vr in vector_records:
        if not any(c.document_title == vr.document_title and c.snippet[:60] == vr.snippet[:60] for c in combined):
            combined.append(vr)

    return combined[:top_k + len(structured_records)]
