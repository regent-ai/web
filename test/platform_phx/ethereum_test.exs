defmodule PlatformPhx.EthereumTest do
  use ExUnit.Case, async: true

  alias PlatformPhx.Ethereum
  alias PlatformPhx.TestEthereumAdapter

  test "verify_signature delegates through the configured adapter" do
    message = "hello regent"
    address = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
    signature = TestEthereumAdapter.sign_message(address, message)

    assert :ok = Ethereum.verify_signature(address, message, signature)
    assert {:error, "Invalid signature"} = Ethereum.verify_signature(address, message, "bad")
  end

  test "namehash and synthetic_tx_hash return deterministic hex strings" do
    assert {:ok, "0x" <> hash} = Ethereum.namehash("regent.eth")
    assert byte_size(hash) == 64

    assert {:ok, "0x" <> tx_hash} = Ethereum.synthetic_tx_hash("mint:test")
    assert byte_size(tx_hash) == 64
  end
end
