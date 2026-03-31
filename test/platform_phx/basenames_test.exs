defmodule PlatformPhx.BasenamesTest do
  use PlatformPhx.DataCase, async: false

  alias PlatformPhx.Basenames
  alias PlatformPhx.Basenames.Mint
  alias PlatformPhx.Basenames.MintAllowance
  alias PlatformPhx.Basenames.PaymentCredit
  alias PlatformPhx.HttpError
  alias PlatformPhx.Repo

  @private_key "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  @owner_address "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
  @payment_tx_hash "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

  test "availability flags reserved labels" do
    payload = Basenames.availability_payload("regent")

    assert payload["reserved"] == true
    assert payload["available"] == false
    assert payload["fqdn"] == "regent.#{Basenames.parent_name()}"
  end

  test "free claim consumes allowance and stores the mint" do
    insert_allowance!(@owner_address, 1)

    result = mint_label!("alpha")

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
        node: Basenames.availability_payload("alpha")["node"]
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

    result = mint_label!("beta", %{"useCredit" => true})

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

    _ = mint_label!("gamma")

    assert_raise HttpError, "Name already taken", fn ->
      mint_label!("gamma")
    end
  end

  defp mint_label!(label, extra_params \\ %{}) do
    timestamp = System.system_time(:millisecond)
    fqdn = "#{label}.#{Basenames.parent_name()}"
    message = Basenames.create_mint_message(@owner_address, fqdn, 8453, timestamp)
    signature = sign_message!(message)

    Basenames.mint!(
      Map.merge(
        %{
          "address" => @owner_address,
          "label" => label,
          "signature" => signature,
          "timestamp" => timestamp
        },
        extra_params
      )
    )
  end

  defp insert_allowance!(address, snapshot_total) do
    Repo.insert!(%MintAllowance{
      parent_node: Basenames.parent_node(),
      parent_name: Basenames.parent_name(),
      address: address,
      snapshot_block_number: 1,
      snapshot_total: snapshot_total,
      free_mints_used: 0
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
