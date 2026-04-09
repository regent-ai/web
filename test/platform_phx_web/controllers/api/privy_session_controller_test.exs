defmodule PlatformPhxWeb.Api.PrivySessionControllerTest do
  use PlatformPhxWeb.ConnCase, async: true

  alias PlatformPhx.Accounts.HumanUser
  alias PlatformPhx.Repo

  test "create signs in a human without accepting or returning role", %{conn: conn} do
    response =
      conn
      |> post("/api/auth/privy/session", %{
        privyUserId: "did:privy:test-user",
        walletAddress: "0x45C9a201e2937608905fEF17De9A67f25F9f98E0",
        walletAddresses: ["0x45C9a201e2937608905fEF17De9A67f25F9f98E0"],
        displayName: "Regent Operator",
        role: "admin"
      })
      |> json_response(200)

    assert response["ok"] == true
    assert response["authenticated"] == true
    refute Map.has_key?(response["human"], "role")

    human = Repo.get_by!(HumanUser, privy_user_id: "did:privy:test-user")

    assert human.wallet_address == "0x45c9a201e2937608905fef17de9a67f25f9f98e0"
    assert human.wallet_addresses == ["0x45c9a201e2937608905fef17de9a67f25f9f98e0"]
    assert human.display_name == "Regent Operator"
  end
end
