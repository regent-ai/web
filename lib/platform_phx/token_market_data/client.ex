defmodule PlatformPhx.TokenMarketData.Client do
  @moduledoc false

  @callback fetch_price_usd(String.t()) :: {:ok, Decimal.t()} | {:error, String.t()}
  @callback fetch_token_decimals(String.t(), String.t()) ::
              {:ok, non_neg_integer()} | {:error, String.t()}
  @callback fetch_token_balance(String.t(), String.t(), String.t()) ::
              {:ok, non_neg_integer()} | {:error, String.t()}
end
