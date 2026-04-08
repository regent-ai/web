defmodule PlatformPhxWeb.Api.OpenseaControllerTest do
  use PlatformPhxWeb.ConnCase, async: false

  @address "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"

  setup do
    previous_client = Application.get_env(:platform_phx, :opensea_http_client)
    previous_responses = Application.get_env(:platform_phx, :opensea_fake_responses)
    previous_api_key = System.get_env("OPENSEA_API_KEY")

    Application.put_env(:platform_phx, :opensea_http_client, PlatformPhx.OpenSeaFakeClient)
    Application.put_env(:platform_phx, :opensea_fake_responses, %{})
    PlatformPhx.OpenSea.clear_cache()

    on_exit(fn ->
      restore_app_env(:platform_phx, :opensea_http_client, previous_client)
      restore_app_env(:platform_phx, :opensea_fake_responses, previous_responses)
      restore_system_env("OPENSEA_API_KEY", previous_api_key)
      PlatformPhx.OpenSea.clear_cache()
    end)

    :ok
  end

  test "returns holdings for a valid collection", %{conn: conn} do
    System.put_env("OPENSEA_API_KEY", "test-key")

    Application.put_env(:platform_phx, :opensea_fake_responses, %{
      request_url(@address, "animata") =>
        {:ok, %{"nfts" => [%{"collection" => "animata", "identifier" => "7"}], "next" => nil}}
    })

    response =
      conn
      |> get("/api/opensea", %{address: @address, collection: "animata"})
      |> json_response(200)

    assert response == %{
             "address" => @address,
             "animata1" => [7],
             "animata2" => [],
             "animataPass" => []
           }
  end

  test "returns 400 for invalid params", %{conn: conn} do
    response =
      conn
      |> get("/api/opensea", %{address: "nope"})
      |> json_response(400)

    assert response["statusMessage"] == "Invalid query params"
  end

  test "returns 503 when the server is missing the api key", %{conn: conn} do
    System.delete_env("OPENSEA_API_KEY")

    response =
      conn
      |> get("/api/opensea", %{address: @address})
      |> json_response(503)

    assert response["statusMessage"] == "Server missing OPENSEA_API_KEY"
  end

  test "returns 502 when opensea fails upstream", %{conn: conn} do
    System.put_env("OPENSEA_API_KEY", "test-key")

    Application.put_env(:platform_phx, :opensea_fake_responses, %{
      request_url(@address, "animata") => {:status, 500, %{"error" => "boom"}},
      request_url(@address, "regent-animata-ii") => {:ok, %{"nfts" => [], "next" => nil}},
      request_url(@address, "regents-club") => {:ok, %{"nfts" => [], "next" => nil}}
    })

    response =
      conn
      |> get("/api/opensea", %{address: @address})
      |> json_response(502)

    assert response["statusMessage"] == "OpenSea request failed with status 500"
  end

  test "returns redeem collection supply stats", %{conn: conn} do
    System.put_env("OPENSEA_API_KEY", "test-key")

    Application.put_env(:platform_phx, :opensea_fake_responses, %{
      collection_url("animata") => {:ok, %{"total_supply" => 248}},
      collection_url("regent-animata-ii") => {:ok, %{"total_supply" => 319}}
    })

    response =
      conn
      |> get("/api/opensea/redeem-stats")
      |> json_response(200)

    assert response == %{"animata" => 248, "regent-animata-ii" => 319}
  end

  test "returns 502 when redeem stats fail upstream", %{conn: conn} do
    System.put_env("OPENSEA_API_KEY", "test-key")

    Application.put_env(:platform_phx, :opensea_fake_responses, %{
      collection_url("animata") => {:status, 500, %{"error" => "boom"}},
      collection_url("regent-animata-ii") => {:ok, %{"total_supply" => 319}}
    })

    response =
      conn
      |> get("/api/opensea/redeem-stats")
      |> json_response(502)

    assert response["statusMessage"] == "OpenSea request failed with status 500"
  end

  defp request_url(address, collection) do
    "https://api.opensea.io/api/v2/chain/base/account/#{address}/nfts?collection=#{collection}&limit=100"
  end

  defp collection_url(slug) do
    "https://api.opensea.io/api/v2/collections/#{slug}"
  end

  defp restore_app_env(app, key, nil), do: Application.delete_env(app, key)
  defp restore_app_env(app, key, value), do: Application.put_env(app, key, value)

  defp restore_system_env(key, nil), do: System.delete_env(key)
  defp restore_system_env(key, value), do: System.put_env(key, value)
end
