defmodule PlatformPhx.TokenMarketDataTest do
  use ExUnit.Case, async: false

  alias PlatformPhx.TokenMarketData
  alias PlatformPhx.TokenMarketDataFakeClient

  setup do
    previous_client = Application.get_env(:platform_phx, :token_market_data_client)
    previous_price = Application.get_env(:platform_phx, :token_market_price_response)
    previous_decimals = Application.get_env(:platform_phx, :token_market_decimals_response)
    previous_balance = Application.get_env(:platform_phx, :token_market_balance_response)
    previous_base_rpc = System.get_env("BASE_RPC_URL")

    Application.put_env(:platform_phx, :token_market_data_client, TokenMarketDataFakeClient)
    System.put_env("BASE_RPC_URL", "https://base.example")
    TokenMarketData.clear_cache()

    on_exit(fn ->
      restore_app_env(:platform_phx, :token_market_data_client, previous_client)
      restore_app_env(:platform_phx, :token_market_price_response, previous_price)
      restore_app_env(:platform_phx, :token_market_decimals_response, previous_decimals)
      restore_app_env(:platform_phx, :token_market_balance_response, previous_balance)

      case previous_base_rpc do
        nil -> System.delete_env("BASE_RPC_URL")
        value -> System.put_env("BASE_RPC_URL", value)
      end

      TokenMarketData.clear_cache()
    end)

    :ok
  end

  test "fetch_summary computes market cap and fdv from live inputs" do
    Application.put_env(:platform_phx, :token_market_price_response, {:ok, "0.0042"})
    Application.put_env(:platform_phx, :token_market_decimals_response, {:ok, 18})

    Application.put_env(
      :platform_phx,
      :token_market_balance_response,
      {:ok, 2_480_000_000 * 10 ** 18}
    )

    assert {:ok, summary} = TokenMarketData.fetch_summary()
    assert summary.market_cap_display == "$115.58M"
    assert summary.fdv_display == "$420M"
  end

  test "fetch_summary reuses the cached payload for one minute" do
    Application.put_env(:platform_phx, :token_market_price_response, {:ok, "0.0042"})
    Application.put_env(:platform_phx, :token_market_decimals_response, {:ok, 18})

    Application.put_env(
      :platform_phx,
      :token_market_balance_response,
      {:ok, 2_480_000_000 * 10 ** 18}
    )

    assert {:ok, first} = TokenMarketData.fetch_summary()

    Application.put_env(:platform_phx, :token_market_price_response, {:ok, "0.0100"})

    assert {:ok, second} = TokenMarketData.fetch_summary()
    assert first == second
  end

  test "fetch_summary surfaces upstream failures" do
    Application.put_env(
      :platform_phx,
      :token_market_price_response,
      {:error, "GeckoTerminal down"}
    )

    Application.put_env(:platform_phx, :token_market_decimals_response, {:ok, 18})
    Application.put_env(:platform_phx, :token_market_balance_response, {:ok, 0})

    assert {:error, {:external, :token_market_data, "GeckoTerminal down"}} =
             TokenMarketData.fetch_summary()
  end

  defp restore_app_env(app, key, nil), do: Application.delete_env(app, key)
  defp restore_app_env(app, key, value), do: Application.put_env(app, key, value)
end
