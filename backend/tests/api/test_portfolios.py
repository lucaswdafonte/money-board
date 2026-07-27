from fastapi.testclient import TestClient


def _register(client: TestClient, email: str) -> dict[str, str]:
    response = client.post("/auth/register", json={"email": email, "password": "supersecret1"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_and_list_portfolio(client: TestClient) -> None:
    headers = _register(client, "owner@example.com")

    create = client.post("/portfolios", json={"name": "Retirement"}, headers=headers)
    assert create.status_code == 201
    body = create.json()
    assert body["name"] == "Retirement"
    assert "id" in body

    listing = client.get("/portfolios", headers=headers)
    assert listing.status_code == 200
    assert [p["name"] for p in listing.json()] == ["Retirement"]


def test_get_update_delete_portfolio(client: TestClient) -> None:
    headers = _register(client, "owner2@example.com")
    portfolio_id = client.post("/portfolios", json={"name": "Growth"}, headers=headers).json()["id"]

    get_resp = client.get(f"/portfolios/{portfolio_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "Growth"

    update_resp = client.patch(
        f"/portfolios/{portfolio_id}", json={"name": "Growth Renamed"}, headers=headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Growth Renamed"

    delete_resp = client.delete(f"/portfolios/{portfolio_id}", headers=headers)
    assert delete_resp.status_code == 204

    missing = client.get(f"/portfolios/{portfolio_id}", headers=headers)
    assert missing.status_code == 404


def test_portfolio_endpoints_require_auth(client: TestClient) -> None:
    assert client.get("/portfolios").status_code == 401
    assert client.post("/portfolios", json={"name": "X"}).status_code == 401


def test_user_cannot_access_another_users_portfolio(client: TestClient) -> None:
    headers_a = _register(client, "a@example.com")
    headers_b = _register(client, "b@example.com")

    portfolio_id = client.post(
        "/portfolios", json={"name": "A's portfolio"}, headers=headers_a
    ).json()["id"]

    assert client.get(f"/portfolios/{portfolio_id}", headers=headers_b).status_code == 404
    assert (
        client.patch(
            f"/portfolios/{portfolio_id}", json={"name": "hijacked"}, headers=headers_b
        ).status_code
        == 404
    )
    assert client.delete(f"/portfolios/{portfolio_id}", headers=headers_b).status_code == 404

    assert client.get(f"/portfolios/{portfolio_id}", headers=headers_a).status_code == 200


def test_create_portfolio_rejects_blank_name(client: TestClient) -> None:
    headers = _register(client, "blank@example.com")
    response = client.post("/portfolios", json={"name": ""}, headers=headers)
    assert response.status_code == 422
