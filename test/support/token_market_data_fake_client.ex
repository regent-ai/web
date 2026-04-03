defmodule PlatformPhx.TokenMarketDataFakeClient do
  @moduledoc false
  @behaviour PlatformPhx.TokenMarketData.Client

  @impl true
  def fetch_price_usd(_token_address) do
    case Application.get_env(
           :platform_phx,
           :token_market_price_response,
           {:error, "missing price"}
         ) do
      {:ok, price} when is_binary(price) -> {:ok, Decimal.new(price)}
      {:ok, %Decimal{} = price} -> {:ok, price}
      {:error, message} -> {:error, message}
    end
  end

  @impl true
  def fetch_token_decimals(_rpc_url, _token_address) do
    Application.get_env(
      :platform_phx,
      :token_market_decimals_response,
      {:error, "missing decimals"}
    )
  end

  @impl true
  def fetch_token_balance(_rpc_url, _token_address, _owner_address) do
    Application.get_env(
      :platform_phx,
      :token_market_balance_response,
      {:error, "missing balance"}
    )
  end
end
