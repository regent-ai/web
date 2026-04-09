defmodule PlatformPhx.AccountsTest do
  use PlatformPhx.DataCase, async: true

  alias PlatformPhx.Accounts

  test "upsert_human_by_privy_id normalizes the current human shape" do
    attrs = %{
      "wallet_address" => " 0x45C9a201e2937608905fEF17De9A67f25F9f98E0 ",
      "wallet_addresses" => ["0x45C9a201e2937608905fEF17De9A67f25F9f98E0", "", nil],
      "display_name" => "  Regent Operator  "
    }

    assert {:ok, human} =
             Accounts.upsert_human_by_privy_id("did:privy:test-user", attrs)

    assert human.wallet_address == "0x45c9a201e2937608905fef17de9a67f25f9f98e0"
    assert human.wallet_addresses == ["0x45c9a201e2937608905fef17de9a67f25f9f98e0"]
    assert human.display_name == "Regent Operator"
  end
end
