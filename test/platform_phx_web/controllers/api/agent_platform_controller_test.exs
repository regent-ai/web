defmodule PlatformPhxWeb.Api.AgentPlatformControllerTest do
  use PlatformPhxWeb.ConnCase, async: false

  alias PlatformPhx.Accounts.HumanUser
  alias PlatformPhx.Basenames.Mint
  alias PlatformPhx.OpenSea
  alias PlatformPhx.Repo

  @address "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"

  setup do
    previous_client = Application.get_env(:platform_phx, :opensea_http_client)
    previous_responses = Application.get_env(:platform_phx, :opensea_fake_responses)
    previous_api_key = System.get_env("OPENSEA_API_KEY")

    Application.put_env(:platform_phx, :opensea_http_client, PlatformPhx.OpenSeaFakeClient)
    Application.put_env(:platform_phx, :opensea_fake_responses, %{})
    System.put_env("OPENSEA_API_KEY", "test-key")
    OpenSea.clear_cache()

    on_exit(fn ->
      restore_app_env(:platform_phx, :opensea_http_client, previous_client)
      restore_app_env(:platform_phx, :opensea_fake_responses, previous_responses)
      restore_system_env("OPENSEA_API_KEY", previous_api_key)
      OpenSea.clear_cache()
    end)

    :ok
  end

  test "wizard returns unauthenticated state without a session", %{conn: conn} do
    response =
      conn
      |> get("/api/agent-platform/wizard")
      |> json_response(200)

    assert response["authenticated"] == false
    assert response["eligible"] == false
    assert response["available_claims"] == []
    assert response["llm_billing"]["connected"] == false
  end

  test "wizard shows eligible holdings and claimed names for a signed-in human", %{conn: conn} do
    human = insert_human!()
    insert_claimed_name!(human, "tempo")

    Application.put_env(:platform_phx, :opensea_fake_responses, %{
      request_url(@address, "animata") =>
        {:ok, %{"nfts" => [%{"collection" => "animata", "identifier" => "7"}], "next" => nil}},
      request_url(@address, "regent-animata-ii") => {:ok, %{"nfts" => [], "next" => nil}},
      request_url(@address, "regents-club") => {:ok, %{"nfts" => [], "next" => nil}}
    })

    response =
      conn
      |> init_test_session(%{current_human_id: human.id})
      |> get("/api/agent-platform/wizard")
      |> json_response(200)

    assert response["authenticated"] == true
    assert response["eligible"] == true
    assert get_in(response, ["collections", "animata1"]) == [7]
    assert Enum.map(response["available_claims"], & &1["label"]) == ["tempo"]
  end

  test "billing connection and company provisioning create a published start company", %{
    conn: conn
  } do
    human = insert_human!()
    insert_claimed_name!(human, "startline")

    Application.put_env(:platform_phx, :opensea_fake_responses, %{
      request_url(@address, "animata") =>
        {:ok, %{"nfts" => [%{"collection" => "animata", "identifier" => "3"}], "next" => nil}},
      request_url(@address, "regent-animata-ii") => {:ok, %{"nfts" => [], "next" => nil}},
      request_url(@address, "regents-club") => {:ok, %{"nfts" => [], "next" => nil}}
    })

    conn = init_test_session(conn, %{current_human_id: human.id})

    billing_response =
      conn
      |> post("/api/agent-platform/wizard/llm-billing")
      |> json_response(200)

    assert billing_response["llm_billing"]["connected"] == true

    response =
      conn
      |> post("/api/agent-platform/wizard/companies", %{claimedLabel: "startline"})
      |> json_response(200)

    assert response["agent"]["slug"] == "startline"
    assert response["agent"]["template_key"] == "start"
    assert response["agent"]["status"] == "published"
    assert response["agent"]["subdomain"]["hostname"] == "startline.regents.sh"
    assert response["agent"]["subdomain"]["active"] == true
    assert response["agent"]["stripe_llm_billing_status"] == "connected"
    assert response["agent"]["sprite_metering_status"] == "trialing"
    assert response["runtime"]["sprite"]["owner"] == "regents"
    assert response["runtime"]["hermes"]["adapter_type"] == "hermes_local"
    assert response["runtime"]["hermes"]["model"] == "glm-5.1"

    mint = Repo.get_by!(Mint, label: "startline")
    assert mint.is_in_use == true
  end

  defp insert_human! do
    %HumanUser{}
    |> HumanUser.changeset(%{
      privy_user_id: "privy-123",
      wallet_address: @address,
      wallet_addresses: [@address],
      display_name: "operator@regents.sh"
    })
    |> Repo.insert!()
  end

  defp insert_claimed_name!(human, label) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    %Mint{}
    |> Mint.changeset(%{
      parent_node: "0xparent",
      parent_name: "agent.base.eth",
      label: label,
      fqdn: "#{label}.agent.base.eth",
      node: "0x#{label}",
      ens_fqdn: "#{label}.regent.eth",
      ens_node: "0xens#{label}",
      owner_address: human.wallet_address,
      tx_hash: "0xtx#{label}",
      ens_tx_hash: "0xenstx#{label}",
      ens_assigned_at: now,
      is_free: true,
      is_in_use: false
    })
    |> Repo.insert!()
  end

  defp request_url(address, collection) do
    "https://api.opensea.io/api/v2/chain/base/account/#{address}/nfts?collection=#{collection}&limit=100"
  end

  defp restore_app_env(app, key, nil), do: Application.delete_env(app, key)
  defp restore_app_env(app, key, value), do: Application.put_env(app, key, value)

  defp restore_system_env(key, nil), do: System.delete_env(key)
  defp restore_system_env(key, value), do: System.put_env(key, value)
end
