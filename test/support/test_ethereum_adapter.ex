defmodule PlatformPhx.TestEthereumAdapter do
  @moduledoc false
  @behaviour PlatformPhx.Ethereum.Adapter

  @spec sign_message(String.t(), String.t()) :: String.t()
  def sign_message(address, message) do
    "signed:#{String.downcase(address)}:#{Base.url_encode64(message, padding: false)}"
  end

  @impl true
  def namehash(name) do
    {:ok, encode_hash(String.trim(name))}
  end

  @impl true
  def verify_signature(address, message, signature) do
    expected = sign_message(address, message)
    if signature == expected, do: :ok, else: {:error, "Invalid signature"}
  end

  @impl true
  def synthetic_tx_hash(payload) do
    {:ok, encode_hash(payload)}
  end

  defp encode_hash(value) do
    "0x" <>
      (:crypto.hash(:sha256, value)
       |> Base.encode16(case: :lower)
       |> binary_part(0, 64))
  end
end
