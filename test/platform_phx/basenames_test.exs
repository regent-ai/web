defmodule PlatformPhx.BasenamesTest do
  use PlatformPhx.DataCase, async: false

  alias PlatformPhx.Basenames
  alias PlatformPhx.Basenames.Mint
  alias PlatformPhx.Basenames.MintAllowance
  alias PlatformPhx.Basenames.PaymentCredit
  alias PlatformPhx.Repo

  @owner_address "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
  @other_address "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"
  @payment_tx_hash "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

  test "availability flags reserved labels" do
    assert {:ok, payload} = Basenames.availability_payload("regent")

    assert payload["reserved"] == true
    assert payload["available"] == false
    assert payload["fqdn"] == "regent.#{Basenames.parent_name()}"
  end

  test "free claim consumes allowance and stores the mint" do
    insert_allowance!(@owner_address, 1)

    assert {:ok, result} = mint_label("alpha")

    assert result["ok"] == true
    assert result["isFree"] == true
    assert result["fqdn"] == "alpha.#{Basenames.parent_name()}"
    assert result["ensFqdn"] == "alpha.#{Basenames.ens_parent_name()}"

    allowance =
      Repo.get_by!(MintAllowance,
        parent_node: Basenames.parent_node(),
        address: @owner_address
      )

    assert allowance.free_mints_used == 1

    mint =
      Repo.get_by!(Mint,
        node: availability_node!("alpha")
      )

    assert mint.is_free == true
    assert mint.owner_address == @owner_address
  end

  test "paid claim consumes the oldest stored payment credit" do
    parent_node = Basenames.parent_node()
    parent_name = Basenames.parent_name()

    Repo.insert!(%PaymentCredit{
      parent_node: parent_node,
      parent_name: parent_name,
      address: @owner_address,
      payment_tx_hash: @payment_tx_hash,
      payment_chain_id: 1,
      price_wei: 2_500_000_000_000_000
    })

    assert {:ok, result} = mint_label("beta", %{"useCredit" => true})

    assert result["ok"] == true
    assert result["isFree"] == false
    assert result["priceWei"] == "2500000000000000"

    credit =
      Repo.get_by!(PaymentCredit,
        payment_tx_hash: @payment_tx_hash,
        payment_chain_id: 1
      )

    assert not is_nil(credit.consumed_at)
    assert credit.consumed_fqdn == "beta.#{parent_name}"
  end

  test "duplicate name claim is rejected" do
    insert_allowance!(@owner_address, 2)

    assert {:ok, _result} = mint_label("gamma")
    assert {:error, {:conflict, "Name already taken"}} = mint_label("gamma")
  end

  test "credit registration reuses the existing tx for the same wallet" do
    insert_allowance!(@owner_address, 0)
    insert_credit!(@owner_address, @payment_tx_hash, nil)

    assert {:ok, response} =
             Basenames.register_credit(%{
               "address" => @owner_address,
               "paymentTxHash" => @payment_tx_hash,
               "paymentChainId" => 1
             })

    assert response["paymentTxHash"] == @payment_tx_hash
    assert response["available"] == true
  end

  test "mark in use enforces ownership" do
    insert_allowance!(@owner_address, 1)
    assert {:ok, _result} = mint_label("zeta")

    assert {:error, {:forbidden, "Name not owned by wallet"}} =
             Basenames.mark_in_use(%{
               "address" => @other_address,
               "label" => "zeta"
             })
  end

  test "mint changeset rejects duplicate node with a controlled error" do
    attrs = %{
      parent_node: Basenames.parent_node(),
      parent_name: Basenames.parent_name(),
      label: "alpha",
      fqdn: "alpha.#{Basenames.parent_name()}",
      node: availability_node!("alpha"),
      owner_address: @owner_address,
      tx_hash: "0x#{String.duplicate("1", 64)}",
      is_free: true,
      is_in_use: false
    }

    assert {:ok, _mint} = %Mint{} |> Mint.changeset(attrs) |> Repo.insert()
    assert {:error, changeset} = %Mint{} |> Mint.changeset(attrs) |> Repo.insert()
    assert {"has already been taken", _opts} = changeset.errors[:node]
  end

  test "payment credit changeset rejects duplicate tx with a controlled error" do
    attrs = %{
      parent_node: Basenames.parent_node(),
      parent_name: Basenames.parent_name(),
      address: @owner_address,
      payment_tx_hash: @payment_tx_hash,
      payment_chain_id: 1,
      price_wei: 2_500_000_000_000_000
    }

    assert {:ok, _credit} = %PaymentCredit{} |> PaymentCredit.changeset(attrs) |> Repo.insert()

    assert {:error, changeset} =
             %PaymentCredit{} |> PaymentCredit.changeset(attrs) |> Repo.insert()

    assert {"has already been taken", _opts} = changeset.errors[:payment_tx_hash]
  end

  test "concurrent mint attempts allow exactly one winner", %{sandbox_owner: sandbox_owner} do
    insert_allowance!(@owner_address, 2)
    params = mint_params("theta")

    results =
      1..2
      |> Task.async_stream(
        fn _ ->
          Ecto.Adapters.SQL.Sandbox.allow(Repo, sandbox_owner, self())
          Basenames.mint_name(params)
        end,
        max_concurrency: 2,
        ordered: false
      )
      |> Enum.map(fn {:ok, result} -> result end)

    assert Enum.count(results, &match?({:ok, _}, &1)) == 1
    assert Enum.count(results, &match?({:error, {:conflict, "Name already taken"}}, &1)) == 1
  end

  test "concurrent credit consumption allows exactly one winner", %{sandbox_owner: sandbox_owner} do
    insert_credit!(@owner_address, @payment_tx_hash, nil)

    params =
      mint_params("iota", %{
        "useCredit" => true,
        "paymentTxHash" => @payment_tx_hash,
        "paymentChainId" => 1
      })

    results =
      1..2
      |> Task.async_stream(
        fn _ ->
          Ecto.Adapters.SQL.Sandbox.allow(Repo, sandbox_owner, self())
          Basenames.mint_name(params)
        end,
        max_concurrency: 2,
        ordered: false
      )
      |> Enum.map(fn {:ok, result} -> result end)

    assert Enum.count(results, &match?({:ok, _}, &1)) == 1

    assert Enum.count(results, fn
             {:error, {:conflict, "Payment already used"}} -> true
             {:error, {:conflict, "Name already taken"}} -> true
             _ -> false
           end) == 1
  end

  defp mint_label(label, extra_params \\ %{}) do
    Basenames.mint_name(mint_params(label, extra_params))
  end

  defp mint_params(label, extra_params \\ %{}) do
    timestamp = System.system_time(:millisecond)
    fqdn = "#{label}.#{Basenames.parent_name()}"
    message = Basenames.create_mint_message(@owner_address, fqdn, 8453, timestamp)
    signature = sign_message!(message)

    Map.merge(
      %{
        "address" => @owner_address,
        "label" => label,
        "signature" => signature,
        "timestamp" => timestamp
      },
      extra_params
    )
  end

  defp insert_allowance!(address, snapshot_total) do
    %MintAllowance{}
    |> MintAllowance.changeset(%{
      parent_node: Basenames.parent_node(),
      parent_name: Basenames.parent_name(),
      address: address,
      snapshot_block_number: 1,
      snapshot_total: snapshot_total,
      free_mints_used: 0
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

  defp sign_message!(message) do
    PlatformPhx.TestEthereumAdapter.sign_message(@owner_address, message)
  end

  defp availability_node!(label) do
    assert {:ok, payload} = Basenames.availability_payload(label)
    payload["node"]
  end
end
