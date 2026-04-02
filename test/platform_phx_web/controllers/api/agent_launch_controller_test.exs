defmodule PlatformPhxWeb.Api.AgentLaunchControllerTest do
  use PlatformPhxWeb.ConnCase, async: false

  alias PlatformPhx.AgentLaunch.Auction
  alias PlatformPhx.Repo

  test "auctions endpoint returns camelized auction payload", %{conn: conn} do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    Repo.insert!(%Auction{
      source_job_id: "job-controller",
      agent_id: "8453:77",
      agent_name: "controller.regent.eth",
      owner_address: "0x1111111111111111111111111111111111111111",
      auction_address: "0x2222222222222222222222222222222222222222",
      token_address: "0x3333333333333333333333333333333333333333",
      network: "base",
      chain_id: 8453,
      status: "active",
      started_at: DateTime.add(now, -600, :second),
      ends_at: DateTime.add(now, 3600, :second),
      claim_at: DateTime.add(now, 7200, :second),
      bidders: 4,
      raised_currency: "14,500 USDC",
      target_currency: "20,000 USDC",
      progress_percent: 72,
      notes: "controller coverage",
      uniswap_url:
        "https://app.uniswap.org/explore/tokens/base/0x3333333333333333333333333333333333333333"
    })

    response =
      conn
      |> get("/api/agentlaunch/auctions")
      |> json_response(200)

    assert is_binary(response["generatedAt"])
    assert is_list(response["auctions"])

    auction =
      Enum.find(response["auctions"], fn row ->
        row["agentId"] == "8453:77"
      end)

    assert auction["agentName"] == "controller.regent.eth"
    assert auction["ownerAddress"] == "0x1111111111111111111111111111111111111111"
    assert auction["auctionAddress"] == "0x2222222222222222222222222222222222222222"
    assert auction["tokenAddress"] == "0x3333333333333333333333333333333333333333"
    assert auction["raisedCurrency"] == "14,500 USDC"
    assert auction["targetCurrency"] == "20,000 USDC"
    assert auction["progressPercent"] == 72
    assert auction["uniswapUrl"] =~ "app.uniswap.org"
  end
end
