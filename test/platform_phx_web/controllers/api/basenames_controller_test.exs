defmodule PlatformPhxWeb.Api.BasenamesControllerTest do
  use PlatformPhxWeb.ConnCase, async: false

  alias PlatformPhx.Basenames
  alias PlatformPhx.Basenames.Mint
  alias PlatformPhx.Basenames.MintAllowance
  alias PlatformPhx.Basenames.PaymentCredit
  alias PlatformPhx.Repo

  @private_key "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  @owner_address "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
  @other_address "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"
  @payment_tx_hash "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"

  test "allowances endpoint lists the snapshot table", %{conn: conn} do
    insert_allowance!(@owner_address, 2, 1)
    insert_allowance!(@other_address, 1, 0)

    response =
      conn
      |> get("/api/basenames/allowances")
      |> json_response(200)

    assert response["parentName"] == Basenames.parent_name()
    assert response["totalAddresses"] == 2
    assert Enum.map(response["allowances"], & &1["address"]) == [@owner_address, @other_address]
    assert Enum.at(response["allowances"], 0)["freeMintsRemaining"] == 1
  end

  test "credits endpoint returns only available payment credits", %{conn: conn} do
    insert_credit!(@owner_address, @payment_tx_hash, nil)

    insert_credit!(
      @owner_address,
      "0x#{String.duplicate("c", 64)}",
      DateTime.utc_now() |> DateTime.truncate(:second)
    )

    response =
      conn
      |> get("/api/basenames/credits", %{address: @owner_address})
      |> json_response(200)

    assert response["availableCredits"] == 1
    assert Enum.at(response["credits"], 0)["paymentTxHash"] == @payment_tx_hash
    assert Enum.at(response["credits"], 0)["priceWei"] == "2500000000000000"
  end

  test "credit registration endpoint validates the tx hash", %{conn: conn} do
    response =
      conn
      |> post("/api/basenames/credit", %{
        "address" => @owner_address,
        "paymentTxHash" => "nope"
      })
      |> json_response(400)

    assert response["statusMessage"] == "Invalid payment tx hash"
  end

  test "mint endpoint preserves duplicate-name status", %{conn: conn} do
    insert_allowance!(@owner_address, 1, 0)
    body = mint_params("delta")

    assert %{"ok" => true} =
             conn
             |> post("/api/basenames/mint", body)
             |> json_response(200)

    duplicate_response =
      build_conn()
      |> post("/api/basenames/mint", mint_params("delta"))
      |> json_response(409)

    assert duplicate_response["statusMessage"] == "Name already taken"
  end

  test "mint endpoint rejects expired signatures", %{conn: conn} do
    insert_allowance!(@owner_address, 1, 0)

    expired_response =
      conn
      |> post(
        "/api/basenames/mint",
        mint_params("echo", System.system_time(:millisecond) - 7_200_000)
      )
      |> json_response(400)

    assert expired_response["statusMessage"] == "Signature expired"
  end

  test "use endpoint can create a random in-use claim", %{conn: conn} do
    response =
      conn
      |> post("/api/basenames/use", %{
        "address" => @owner_address,
        "label" => "foxtrot",
        "isRandom" => true
      })
      |> json_response(200)

    assert response["ok"] == true
    assert response["existed"] == false
    assert response["isInUse"] == true

    mint = Repo.get_by!(Mint, node: Basenames.availability_payload("foxtrot")["node"])
    assert mint.is_in_use == true
    assert mint.is_free == true
  end

  test "use endpoint returns not found for missing owned names", %{conn: conn} do
    response =
      conn
      |> post("/api/basenames/use", %{
        "address" => @owner_address,
        "label" => "ghost"
      })
      |> json_response(404)

    assert response["statusMessage"] == "Name not found"
  end

  defp mint_params(label, timestamp \\ System.system_time(:millisecond)) do
    fqdn = "#{label}.#{Basenames.parent_name()}"
    message = Basenames.create_mint_message(@owner_address, fqdn, 8453, timestamp)

    %{
      "address" => @owner_address,
      "label" => label,
      "signature" => sign_message!(message),
      "timestamp" => timestamp
    }
  end

  defp insert_allowance!(address, snapshot_total, free_mints_used) do
    Repo.insert!(%MintAllowance{
      parent_node: Basenames.parent_node(),
      parent_name: Basenames.parent_name(),
      address: address,
      snapshot_block_number: 1,
      snapshot_total: snapshot_total,
      free_mints_used: free_mints_used
    })
  end

  defp insert_credit!(address, payment_tx_hash, consumed_at) do
    Repo.insert!(%PaymentCredit{
      parent_node: Basenames.parent_node(),
      parent_name: Basenames.parent_name(),
      address: address,
      payment_tx_hash: payment_tx_hash,
      payment_chain_id: 1,
      price_wei: 2_500_000_000_000_000,
      consumed_at: consumed_at
    })
  end

  defp sign_message!(message) do
    {signature, 0} =
      System.cmd("cast", ["wallet", "sign", "--private-key", @private_key, message],
        stderr_to_stdout: true
      )

    String.trim(signature)
  end
end
