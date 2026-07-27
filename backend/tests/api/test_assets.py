from fastapi.testclient import TestClient

ASSET_PAYLOAD = {
    "ticker": "PETR4",
    "name": "Petrobras PN",
    "asset_class": "stock",
    "sector": "Energy",
    "country": "Brazil",
    "currency": "BRL",
}


def _register(client: TestClient, email: str) -> dict[str, str]:
    response = client.post("/auth/register", json={"email": email, "password": "supersecret1"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_portfolio(client: TestClient, headers: dict[str, str], name: str = "Main") -> str:
    response = client.post("/portfolios", json={"name": name}, headers=headers)
    return response.json()["id"]


def test_create_and_list_asset(client: TestClient) -> None:
    headers = _register(client, "assets-owner@example.com")
    portfolio_id = _create_portfolio(client, headers)

    create = client.post(f"/portfolios/{portfolio_id}/assets", json=ASSET_PAYLOAD, headers=headers)
    assert create.status_code == 201
    body = create.json()
    assert body["ticker"] == "PETR4"
    assert body["asset_class"] == "stock"
    assert body["portfolio_id"] == portfolio_id

    listing = client.get(f"/portfolios/{portfolio_id}/assets", headers=headers)
    assert listing.status_code == 200
    assert len(listing.json()) == 1


def test_asset_class_must_be_valid_enum_value(client: TestClient) -> None:
    headers = _register(client, "bad-class@example.com")
    portfolio_id = _create_portfolio(client, headers)

    payload = {**ASSET_PAYLOAD, "asset_class": "not-a-real-class"}
    response = client.post(f"/portfolios/{portfolio_id}/assets", json=payload, headers=headers)
    assert response.status_code == 422


def test_duplicate_ticker_in_same_portfolio_rejected(client: TestClient) -> None:
    headers = _register(client, "dup-ticker@example.com")
    portfolio_id = _create_portfolio(client, headers)

    client.post(f"/portfolios/{portfolio_id}/assets", json=ASSET_PAYLOAD, headers=headers)
    response = client.post(f"/portfolios/{portfolio_id}/assets", json=ASSET_PAYLOAD, headers=headers)
    assert response.status_code == 409


def test_same_ticker_allowed_in_different_portfolios(client: TestClient) -> None:
    headers = _register(client, "multi-portfolio@example.com")
    portfolio_1 = _create_portfolio(client, headers, name="P1")
    portfolio_2 = _create_portfolio(client, headers, name="P2")

    assert (
        client.post(
            f"/portfolios/{portfolio_1}/assets", json=ASSET_PAYLOAD, headers=headers
        ).status_code
        == 201
    )
    assert (
        client.post(
            f"/portfolios/{portfolio_2}/assets", json=ASSET_PAYLOAD, headers=headers
        ).status_code
        == 201
    )


def test_update_and_delete_asset(client: TestClient) -> None:
    headers = _register(client, "update-asset@example.com")
    portfolio_id = _create_portfolio(client, headers)
    asset_id = client.post(
        f"/portfolios/{portfolio_id}/assets", json=ASSET_PAYLOAD, headers=headers
    ).json()["id"]

    update_resp = client.patch(
        f"/portfolios/{portfolio_id}/assets/{asset_id}",
        json={"name": "Petrobras Renamed"},
        headers=headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Petrobras Renamed"
    assert update_resp.json()["ticker"] == "PETR4"

    delete_resp = client.delete(f"/portfolios/{portfolio_id}/assets/{asset_id}", headers=headers)
    assert delete_resp.status_code == 204

    missing = client.get(f"/portfolios/{portfolio_id}/assets/{asset_id}", headers=headers)
    assert missing.status_code == 404


def test_asset_endpoints_scoped_to_owner(client: TestClient) -> None:
    headers_a = _register(client, "asset-owner-a@example.com")
    headers_b = _register(client, "asset-owner-b@example.com")
    portfolio_id = _create_portfolio(client, headers_a)
    asset_id = client.post(
        f"/portfolios/{portfolio_id}/assets", json=ASSET_PAYLOAD, headers=headers_a
    ).json()["id"]

    assert client.get(f"/portfolios/{portfolio_id}/assets", headers=headers_b).status_code == 404
    assert (
        client.get(f"/portfolios/{portfolio_id}/assets/{asset_id}", headers=headers_b).status_code
        == 404
    )


def test_deleting_portfolio_cascades_to_assets(client: TestClient) -> None:
    headers = _register(client, "cascade@example.com")
    portfolio_id = _create_portfolio(client, headers)
    asset_id = client.post(
        f"/portfolios/{portfolio_id}/assets", json=ASSET_PAYLOAD, headers=headers
    ).json()["id"]

    assert client.delete(f"/portfolios/{portfolio_id}", headers=headers).status_code == 204
    assert (
        client.get(f"/portfolios/{portfolio_id}/assets/{asset_id}", headers=headers).status_code
        == 404
    )
