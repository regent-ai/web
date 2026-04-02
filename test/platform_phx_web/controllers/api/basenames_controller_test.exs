defmodule PlatformPhxWeb.Api.BasenamesControllerTest do
  use PlatformPhxWeb.ConnCase, async: false

  alias PlatformPhx.Basenames
  alias PlatformPhx.Basenames.Mint
  alias PlatformPhx.Basenames.MintAllowance
  alias PlatformPhx.Basenames.PaymentCredit
  alias PlatformPhx.Repo

  @owner_address "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
  @other_address "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"
  @payment_tx_hash "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"

  test "config endpoint returns the basenames configuration", %{conn: conn} do
    response =
      conn
      |> get("/api/basenames/config")
      |> json_response(200)

    assert response["chainId"] == Basenames.base_chain_id()
    assert response["parentName"] == Basenames.parent_name()
    assert response["ensParentName"] == Basenames.ens_parent_name()
    assert response["dbEnabled"] == true
    assert response["mintingEnabled"] == true
    assert response["ensMintingEnabled"] == true
    assert is_binary(response["parentNode"])
    assert is_binary(response["ensParentNode"])
  end

  test "allowance endpoint returns the allowance view for one address", %{conn: conn} do
    insert_allowance!(@owner_address, 3, 1)

    response =
      conn
      |> get("/api/basenames/allowance", %{address: @owner_address})
      |> json_response(200)

    assert response["address"] == @owner_address
    assert response["snapshotTotal"] == 3
    assert response["freeMintsUsed"] == 1
    assert response["freeMintsRemaining"] == 2
  end

  test "allowance endpoint rejects invalid addresses", %{conn: conn} do
    response =
      conn
      |> get("/api/basenames/allowance", %{address: "nope"})
      |> json_response(400)

    assert response["statusMessage"] == "Invalid address"
  end

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

  test "availability endpoint returns an available payload", %{conn: conn} do
    response =
      conn
      |> get("/api/basenames/availability", %{label: "fresh"})
      |> json_response(200)

    assert response["label"] == "fresh"
    assert response["fqdn"] == "fresh.#{Basenames.parent_name()}"
    assert response["available"] == true
    assert response["basenamesAvailable"] == true
    assert response["ensAvailable"] == true
    assert response["reserved"] == false
  end

  test "owned endpoint returns names for one owner ordered newest first", %{conn: conn} do
    insert_mint!(%{
      label: "alpha",
      fqdn: "alpha.#{Basenames.parent_name()}",
      node: "0x#{String.duplicate("1", 64)}",
      owner_address: @owner_address,
      tx_hash: "0x#{String.duplicate("a", 64)}",
      created_at: ~U[2026-04-01 18:00:00Z]
    })

    insert_mint!(%{
      label: "bravo",
      fqdn: "bravo.#{Basenames.parent_name()}",
      node: "0x#{String.duplicate("2", 64)}",
      owner_address: @owner_address,
      tx_hash: "0x#{String.duplicate("b", 64)}",
      created_at: ~U[2026-04-01 19:00:00Z]
    })

    response =
      conn
      |> get("/api/basenames/owned", %{address: @owner_address})
      |> json_response(200)

    assert response["address"] == @owner_address
    assert Enum.map(response["names"], & &1["label"]) == ["bravo", "alpha"]
    assert Enum.at(response["names"], 0)["fqdn"] == "bravo.#{Basenames.parent_name()}"
  end

  test "recent endpoint returns recent names and validates limit", %{conn: conn} do
    insert_mint!(%{
      label: "older",
      fqdn: "older.#{Basenames.parent_name()}",
      node: "0x#{String.duplicate("3", 64)}",
      owner_address: @owner_address,
      tx_hash: "0x#{String.duplicate("c", 64)}",
      created_at: ~U[2026-04-01 17:00:00Z]
    })

    insert_mint!(%{
      label: "newer",
      fqdn: "newer.#{Basenames.parent_name()}",
      node: "0x#{String.duplicate("4", 64)}",
      owner_address: @owner_address,
      tx_hash: "0x#{String.duplicate("d", 64)}",
      created_at: ~U[2026-04-01 20:00:00Z]
    })

    response =
      conn
      |> get("/api/basenames/recent", %{limit: "1"})
      |> json_response(200)

    assert Enum.map(response["names"], & &1["label"]) == ["newer"]

    invalid_response =
      build_conn()
      |> get("/api/basenames/recent", %{limit: "nope"})
      |> json_response(400)

    assert invalid_response["statusMessage"] == "Invalid limit"
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

    assert {:ok, availability} = Basenames.availability_payload("foxtrot")
    mint = Repo.get_by!(Mint, node: availability["node"])
    assert mint.is_in_use == true
    assert mint.is_free == true
  end

  test "mint endpoint rejects invalid signatures", %{conn: conn} do
    insert_allowance!(@owner_address, 1, 0)

    response =
      conn
      |> post("/api/basenames/mint", %{
        "address" => @owner_address,
        "label" => "juliet",
        "signature" => "signed:bad",
        "timestamp" => System.system_time(:millisecond)
      })
      |> json_response(400)

    assert response["statusMessage"] == "Invalid signature"
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
    %MintAllowance{}
    |> MintAllowance.changeset(%{
      parent_node: Basenames.parent_node(),
      parent_name: Basenames.parent_name(),
      address: address,
      snapshot_block_number: 1,
      snapshot_total: snapshot_total,
      free_mints_used: free_mints_used
    })
    |> Repo.insert!()
  end

  defp insert_credit!(address, payment_tx_hash, consumed_at) do
    %PaymentCredit{}
    |> PaymentCredit.changeset(%{
      parent_node: Basenames.parent_node(),
      parent_name: Basenames.parent_name(),
      address: address,
      payment_tx_hash: payment_tx_hash,
      payment_chain_id: 1,
      price_wei: 2_500_000_000_000_000,
      consumed_at: consumed_at
    })
    |> Repo.insert!()
  end

  defp insert_mint!(attrs) do
    Repo.insert!(
      struct!(
        Mint,
        %{
          parent_node: Basenames.parent_node(),
          parent_name: Basenames.parent_name(),
          ens_fqdn: nil,
          ens_node: nil,
          ens_tx_hash: nil,
          ens_assigned_at: nil,
          payment_tx_hash: nil,
          payment_chain_id: nil,
          price_wei: nil,
          is_free: true,
          is_in_use: false
        }
        |> Map.merge(attrs)
      )
    )
  end

  defp sign_message!(message) do
    PlatformPhx.TestEthereumAdapter.sign_message(@owner_address, message)
  end
end
