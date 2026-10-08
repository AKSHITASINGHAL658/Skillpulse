import urllib.request
import json

def test_post_endpoints():
    print("--- 4. Testing POST Endpoints ---")
    headers = {"Content-Type": "application/json"}

    # 1. Update target role
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/users/target-role",
        data=json.dumps({"target_role_id": 2}).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        print(f"  POST /users/target-role: {resp.status} -> {resp.read().decode('utf-8')}")

    # 2. Add / update user skill
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/users/skills",
        data=json.dumps({"skill_id": 7, "proficiency": 4}).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        print(f"  POST /users/skills: {resp.status} -> {resp.read().decode('utf-8')}")

    # 3. Generate recommendation
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/recommendations/generate",
        data=b"{}",
        headers=headers,
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        rec_data = json.loads(resp.read().decode("utf-8"))
        print(f"  POST /recommendations/generate: {resp.status} -> Role: {rec_data['recommendation']['target_role_title']}, Readiness: {rec_data['recommendation']['readiness_score']}%, Steps: {len(rec_data['roadmap_steps'])}")

    # 4. Refresh materialized view
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/admin/refresh-views",
        data=b"{}",
        headers=headers,
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        print(f"  POST /admin/refresh-views: {resp.status} -> {resp.read().decode('utf-8')}")

    # 5. Create skill alias
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/admin/aliases",
        data=json.dumps({"alias_name": "react.js test alias", "skill_id": 7}).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"  POST /admin/aliases: {resp.status} -> {resp.read().decode('utf-8')}")
    except Exception as e:
        print(f"  POST /admin/aliases: note: {e}")

    # Reset user 1 target_role_id back to 1 for consistency
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/users/target-role",
        data=json.dumps({"target_role_id": 1}).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        print(f"  Reset target_role_id to 1: {resp.status}")

if __name__ == "__main__":
    test_post_endpoints()
