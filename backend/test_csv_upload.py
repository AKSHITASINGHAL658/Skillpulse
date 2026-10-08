import urllib.request
import uuid

def test_upload():
    boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
    csv_content = """company_name,role_title,role_category,city,state,title,experience_level,min_exp_yrs,salary_min,salary_max,employment_type,posted_date,skills
Acme Corp,Java Backend Developer,Software Engineering,San Francisco,CA,Senior Java Architect,Senior,5,160000,210000,Full-Time,2026-09-15,"Java, Spring Boot, PostgreSQL, Docker"
CloudScale,Data Analyst,Data & AI,New York,NY,Lead Data Analyst,Mid-Level,3,115000,150000,Full-Time,2026-09-18,"SQL, Python, Tableau, Pandas"
"""

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="sample_jobs.csv"\r\n'
        f"Content-Type: text/csv\r\n\r\n"
        f"{csv_content}\r\n"
        f"--{boundary}--\r\n"
    ).encode("utf-8")

    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/admin/import-csv",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )

    with urllib.request.urlopen(req) as resp:
        print("CSV Upload Result:", resp.status, resp.read().decode())

if __name__ == "__main__":
    test_upload()
