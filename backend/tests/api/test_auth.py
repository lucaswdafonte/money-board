from fastapi.testclient import TestClient


def test_register_then_me(client: TestClient) -> None:
    response = client.post(
        "/auth/register", json={"email": "investor@example.com", "password": "supersecret1"}
    )
    assert response.status_code == 201
    token = response.json()["access_token"]

    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "investor@example.com"


def test_register_duplicate_email_rejected(client: TestClient) -> None:
    payload = {"email": "dup@example.com", "password": "supersecret1"}
    assert client.post("/auth/register", json=payload).status_code == 201
    assert client.post("/auth/register", json=payload).status_code == 409


def test_login_with_correct_credentials(client: TestClient) -> None:
    client.post("/auth/register", json={"email": "login@example.com", "password": "supersecret1"})

    response = client.post(
        "/auth/login", json={"email": "login@example.com", "password": "supersecret1"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_with_wrong_password_rejected(client: TestClient) -> None:
    client.post("/auth/register", json={"email": "login2@example.com", "password": "supersecret1"})

    response = client.post(
        "/auth/login", json={"email": "login2@example.com", "password": "wrong-password"}
    )
    assert response.status_code == 401


def test_login_with_unknown_email_rejected(client: TestClient) -> None:
    response = client.post(
        "/auth/login", json={"email": "nobody@example.com", "password": "whatever1"}
    )
    assert response.status_code == 401


def test_me_requires_auth(client: TestClient) -> None:
    assert client.get("/auth/me").status_code == 401
