defmodule PlatformPhx.OpenSeaTest do
  use ExUnit.Case, async: false

  alias PlatformPhx.OpenSea
  alias PlatformPhx.OpenSeaFakeClient

  @address "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"

  setup do
    previous_client = Application.get_env(:platform_phx, :opensea_http_client)
    previous_responses = Application.get_env(:platform_phx, :opensea_fake_responses)
    previous_key = System.get_env("OPENSEA_API_KEY")

    Application.put_env(:platform_phx, :opensea_http_client, OpenSeaFakeClient)
    Application.put_env(:platform_phx, :opensea_fake_responses, %{})
    System.put_env("OPENSEA_API_KEY", "test-opensea-key")
    OpenSea.clear_cache()

    on_exit(fn ->
      restore_app_env(:platform_phx, :opensea_http_client, previous_client)
      restore_app_env(:platform_phx, :opensea_fake_responses, previous_responses)

      case previous_key do
        nil -> System.delete_env("OPENSEA_API_KEY")
        value -> System.put_env("OPENSEA_API_KEY", value)
      end

      OpenSea.clear_cache()
    end)
  end

  test "fetch_holdings returns sorted ids across requested collections" do
    Application.put_env(:platform_phx, :opensea_fake_responses, %{
      request_url(@address, "animata") =>
        {:ok, %{"nfts" => [%{"identifier" => "2"}], "next" => "cursor-1"}},
      request_url(@address, "animata", "cursor-1") =>
        {:ok, %{"nfts" => [%{"identifier" => "1"}], "next" => nil}},
      request_url(@address, "regent-animata-ii") =>
        {:ok, %{"nfts" => [%{"identifier" => "7"}], "next" => nil}},
      request_url(@address, "regents-club") =>
        {:ok, %{"nfts" => [%{"identifier" => "4"}], "next" => nil}}
    })

    assert {:ok, payload} = OpenSea.fetch_holdings(@address)
    assert payload["animata1"] == [1, 2]
    assert payload["animata2"] == [7]
    assert payload["animataPass"] == [4]
  end

  test "fetch_holdings rejects invalid collection params" do
    assert {:error, {:bad_request, "Invalid query params"}} =
             OpenSea.fetch_holdings(@address, "bad-collection")
  end

  test "fetch_holdings surfaces upstream failures" do
    Application.put_env(:platform_phx, :opensea_fake_responses, %{
      request_url(@address, "animata") => {:error, "timeout"}
    })

    assert {:error, {:external, :opensea, "OpenSea request failed: timeout"}} =
             OpenSea.fetch_holdings(@address, "animata")
  end

  test "fetch_redeem_stats returns collection supply counts" do
    Application.put_env(:platform_phx, :opensea_fake_responses, %{
      collection_url("animata") => {:ok, %{"total_supply" => 248}},
      collection_url("regent-animata-ii") => {:ok, %{"total_supply" => 319}}
    })

    assert {:ok, payload} = OpenSea.fetch_redeem_stats()
    assert payload == %{"animata" => 248, "regent-animata-ii" => 319}
  end

  test "fetch_redeem_stats surfaces collection lookup failures" do
    Application.put_env(:platform_phx, :opensea_fake_responses, %{
      collection_url("animata") => {:status, 500, %{"error" => "boom"}},
      collection_url("regent-animata-ii") => {:ok, %{"total_supply" => 319}}
    })

    assert {:error, {:external, :opensea, "OpenSea request failed with status 500"}} =
             OpenSea.fetch_redeem_stats()
  end

  defp request_url(address, collection) do
    "https://api.opensea.io/api/v2/chain/base/account/#{address}/nfts?collection=#{collection}&limit=100"
  end

  defp request_url(address, collection, cursor) do
    "#{request_url(address, collection)}&next=#{URI.encode_www_form(cursor)}"
  end

  defp collection_url(slug) do
    "https://api.opensea.io/api/v2/collections/#{slug}"
  end

  defp restore_app_env(app, key, nil), do: Application.delete_env(app, key)
  defp restore_app_env(app, key, value), do: Application.put_env(app, key, value)
end
