"""
End-to-End Multi-Document Integration Test for CiteMind.

Verifies:
  1. Uploading multiple distinct academic PDFs (Operating Systems + Computer Networks)
  2. Document library tracking via GET /api/documents
  3. Subject-specific cross-retrieval via POST /api/ask
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Anchor backend/src to path
SRC_DIR = Path(__file__).resolve().parent.parent / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from main import app


def test_multi_document_workflow():
    client = TestClient(app)

    print("\n" + "=" * 60)
    print("CiteMind Multi-Document Integration Test")
    print("=" * 60)

    # 1. Upload Second PDF (Computer Networks)
    net_pdf = Path(__file__).resolve().parent.parent / "sample_docs" / "computer_networks_lecture.pdf"
    assert net_pdf.exists(), f"Missing test PDF at {net_pdf}"

    with open(net_pdf, "rb") as f:
        r_up = client.post(
            "/api/upload",
            files={"file": ("computer_networks_lecture.pdf", f, "application/pdf")}
        )

    print(f"\n[Upload] Status Code: {r_up.status_code}")
    print(f"Message: {r_up.json().get('message')}")
    assert r_up.status_code == 201

    # 2. Check Document Library Overview
    r_docs = client.get("/api/documents")
    assert r_docs.status_code == 200
    docs_data = r_docs.json()

    print("\n" + "-" * 40)
    print("Document Library Overview (/api/documents)")
    print("-" * 40)
    print(f"Total Documents: {docs_data.get('total_documents')}")
    print(f"Total Vectors in FAISS: {docs_data.get('total_vectors')}")
    for doc in docs_data.get("documents", []):
        print(f"  • {doc['filename']}: {doc['total_pages']} pages | {doc['total_chunks']} chunks | {doc['file_size_kb']} KB")

    # 3. Test Question A: Computer Networks Subject
    print("\n" + "-" * 40)
    print("Query 1: Networking Subject")
    print("-" * 40)
    q1 = "Explain how Dijkstra algorithm is used in Link-State routing"
    r_q1 = client.post("/api/ask", json={"question": q1})
    assert r_q1.status_code == 200
    data_q1 = r_q1.json()

    print(f"Question: '{q1}'")
    print(f"Has Context: {data_q1['has_sufficient_context']}")
    print(f"Latency: {data_q1['total_time_ms']} ms")
    print("Citations Retrieved:")
    for cit in data_q1.get("citations", []):
        print(f"  -> [{cit['source']}] Page {cit['page_number']} (Score: {cit['score']})")

    # Verify top citation is from computer_networks_lecture.pdf
    top_source = data_q1["citations"][0]["source"]
    print(f"Verified Top Source: {top_source}")
    assert "computer_networks" in top_source

    # 4. Test Question B: Operating Systems Subject
    print("\n" + "-" * 40)
    print("Query 2: Operating Systems Subject")
    print("-" * 40)
    q2 = "What is a process and its stack and heap memory?"
    r_q2 = client.post("/api/ask", json={"question": q2})
    assert r_q2.status_code == 200
    data_q2 = r_q2.json()

    print(f"Question: '{q2}'")
    print(f"Has Context: {data_q2['has_sufficient_context']}")
    print(f"Latency: {data_q2['total_time_ms']} ms")
    print("Citations Retrieved:")
    for cit in data_q2.get("citations", []):
        print(f"  -> [{cit['source']}] Page {cit['page_number']} (Score: {cit['score']})")

    # Verify top citation is from operating_systems_lecture.pdf
    top_source_2 = data_q2["citations"][0]["source"]
    print(f"Verified Top Source: {top_source_2}")
    assert "operating_systems" in top_source_2

    print("\n" + "=" * 60)
    print("ALL MULTI-DOCUMENT INTEGRATION TESTS PASSED!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    test_multi_document_workflow()
