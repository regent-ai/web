defmodule PlatformPhx.TokenMarketData.ReqClient do
  @moduledoc false
  @behaviour PlatformPhx.TokenMarketData.Client

  alias PlatformPhx.Ethereum

  @impl true
  def fetch_price_usd(token_address) do
    url = "https://api.geckoterminal.com/api/v2/networks/base/tokens/#{token_address}"

    case Req.get(url, headers: [{"accept", "application/json"}]) do
      {:ok, %{status: status, body: %{"data" => %{"attributes" => %{"price_usd" => price}}}}}
      when status in 200..299 and is_binary(price) ->
        {:ok, Decimal.new(price)}

      {:ok, %{status: status, body: body}} when status in 200..299 ->
        {:error, "GeckoTerminal response invalid: #{inspect(body)}"}

      {:ok, %{status: status}} ->
        {:error, "GeckoTerminal request failed with status #{status}"}

      {:error, error} ->
        {:error, Exception.message(error)}
    end
  end

  @impl true
  def fetch_token_decimals(rpc_url, token_address) do
    with {:ok, hex} <-
           Ethereum.json_rpc(rpc_url, "eth_call", [
             %{"to" => token_address, "data" => "0x313ce567"},
             "latest"
           ]) do
      {:ok, Ethereum.hex_to_integer(hex)}
    end
  end

  @impl true
  def fetch_token_balance(rpc_url, token_address, owner_address) do
    data =
      "0x70a08231" <> String.duplicate("0", 24) <> String.replace_prefix(owner_address, "0x", "")

    with {:ok, hex} <-
           Ethereum.json_rpc(
             rpc_url,
             "eth_call",
             [%{"to" => token_address, "data" => data}, "latest"]
           ) do
      {:ok, Ethereum.hex_to_integer(hex)}
    end
  end
end
