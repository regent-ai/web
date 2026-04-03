defmodule PlatformPhx.TokenMarketData do
  @moduledoc false

  alias PlatformPhx.RuntimeConfig

  @cache_key :regent_market_summary
  @cache_table :platform_phx_token_market_cache
  @cache_ttl_ms :timer.minutes(1)
  @regent_token "0x6f89bca4ea5931edfcb09786267b251dee752b07"
  @redeemer_address "0x71065b775a590c43933f10c0055dc7d74afabb0e"
  @circulating_base_supply Decimal.new("30000000000")
  @fdv_supply Decimal.new("100000000000")

  @type reason :: {:unavailable, String.t()} | {:external, atom(), String.t()}

  @spec fetch_summary() :: {:ok, map()} | {:error, reason()}
  def fetch_summary do
    with {:miss, table} <- fetch_cached(@cache_key),
         {:ok, summary} <- build_summary() do
      put_cached(table, @cache_key, summary)
      {:ok, summary}
    else
      {:hit, summary} -> {:ok, summary}
      {:error, reason} -> {:error, reason}
    end
  end

  @spec clear_cache() :: :ok
  def clear_cache do
    case :ets.whereis(@cache_table) do
      :undefined -> :ok
      table -> :ets.delete_all_objects(table)
    end

    :ok
  end

  defp build_summary do
    with {:ok, rpc_url} <- rpc_url(),
         {:ok, price_usd} <- client().fetch_price_usd(@regent_token),
         {:ok, decimals} <- client().fetch_token_decimals(rpc_url, @regent_token),
         {:ok, redeemer_balance_raw} <-
           client().fetch_token_balance(rpc_url, @regent_token, @redeemer_address) do
      redeemer_balance = scale_token_amount(redeemer_balance_raw, decimals)
      circulating_supply = Decimal.sub(@circulating_base_supply, redeemer_balance)
      market_cap = Decimal.mult(price_usd, circulating_supply)
      fdv = Decimal.mult(price_usd, @fdv_supply)

      {:ok,
       %{
         price_usd: price_usd,
         circulating_supply: circulating_supply,
         market_cap: market_cap,
         fdv: fdv,
         market_cap_display: format_short_usd(market_cap),
         fdv_display: format_short_usd(fdv)
       }}
    else
      {:error, {:unavailable, _message} = reason} ->
        {:error, reason}

      {:error, message} when is_binary(message) ->
        {:error, {:external, :token_market_data, message}}
    end
  end

  defp scale_token_amount(raw_balance, decimals) do
    Decimal.div(Decimal.new(raw_balance), Decimal.new(pow10_string(decimals)))
  end

  defp pow10_string(decimals) do
    "1" <> String.duplicate("0", max(decimals, 0))
  end

  defp rpc_url do
    case RuntimeConfig.base_rpc_url() do
      nil -> {:error, {:unavailable, "Server missing BASE_RPC_URL"}}
      url -> {:ok, url}
    end
  end

  defp client do
    Application.get_env(
      :platform_phx,
      :token_market_data_client,
      PlatformPhx.TokenMarketData.ReqClient
    )
  end

  defp format_short_usd(value) do
    cond do
      Decimal.compare(value, Decimal.new("1000000000")) != :lt ->
        "$" <> format_compact(value, Decimal.new("1000000000"), "B")

      Decimal.compare(value, Decimal.new("1000000")) != :lt ->
        "$" <> format_compact(value, Decimal.new("1000000"), "M")

      Decimal.compare(value, Decimal.new("1000")) != :lt ->
        "$" <> format_compact(value, Decimal.new("1000"), "K")

      true ->
        "$" <>
          (value
           |> Decimal.round(2)
           |> Decimal.normalize()
           |> Decimal.to_string(:normal))
    end
  end

  defp format_compact(value, divisor, suffix) do
    scaled =
      value
      |> Decimal.div(divisor)
      |> Decimal.round(2)
      |> Decimal.normalize()
      |> Decimal.to_string(:normal)

    scaled <> suffix
  end

  defp fetch_cached(key) do
    table = ensure_cache_table()
    now = System.monotonic_time(:millisecond)

    case :ets.lookup(table, key) do
      [{^key, expires_at, value}] when expires_at > now -> {:hit, value}
      _stale_or_missing -> {:miss, table}
    end
  end

  defp put_cached(table, key, value) do
    expires_at = System.monotonic_time(:millisecond) + @cache_ttl_ms
    true = :ets.insert(table, {key, expires_at, value})
    :ok
  end

  defp ensure_cache_table do
    case :ets.whereis(@cache_table) do
      :undefined ->
        :ets.new(@cache_table, [:named_table, :public, read_concurrency: true])

      table ->
        table
    end
  end
end
