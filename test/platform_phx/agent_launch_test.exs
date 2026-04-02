defmodule PlatformPhx.AgentLaunchTest do
  use PlatformPhx.DataCase, async: false

  alias PlatformPhx.AgentLaunch
  alias PlatformPhx.AgentLaunch.Auction
  alias PlatformPhx.Repo

  test "falls back to demo auctions when the table is empty" do
    auctions = AgentLaunch.list_auctions()

    assert length(auctions) == 2
    assert Enum.any?(auctions, &(&1.agent_name == "demo.regent.eth"))
  end

  test "splits current and past auctions with the expected ordering" do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    Repo.insert!(%Auction{
      source_job_id: "job-current",
      agent_id: "8453:42",
      agent_name: "current.regent.eth",
      owner_address: "0x1111111111111111111111111111111111111111",
      auction_address: "0x2222222222222222222222222222222222222222",
      token_address: nil,
      network: "base",
      chain_id: 8453,
      status: "active",
      started_at: DateTime.add(now, -3600, :second),
      ends_at: DateTime.add(now, 7200, :second),
      claim_at: nil,
      bidders: 3,
      raised_currency: "10 ETH",
      target_currency: "20 ETH",
      progress_percent: 50,
      notes: "live"
    })

    Repo.insert!(%Auction{
      source_job_id: "job-past",
      agent_id: "1:7",
      agent_name: "past.regent.eth",
      owner_address: "0x3333333333333333333333333333333333333333",
      auction_address: "0x4444444444444444444444444444444444444444",
      token_address: nil,
      network: "ethereum",
      chain_id: 1,
      status: "settled",
      started_at: DateTime.add(now, -10_000, :second),
      ends_at: DateTime.add(now, -1_000, :second),
      claim_at: nil,
      bidders: 8,
      raised_currency: "28 ETH",
      target_currency: "30 ETH",
      progress_percent: 93,
      notes: "closed"
    })

    auctions = AgentLaunch.list_auctions()
    split = AgentLaunch.split_auctions(auctions)

    assert Enum.map(split.current, & &1.agent_name) == ["current.regent.eth"]
    assert Enum.map(split.past, & &1.agent_name) == ["past.regent.eth"]

    payload = AgentLaunch.generated_payload(auctions)

    assert length(payload.auctions) == 2
    assert Enum.any?(payload.auctions, &(&1.agent_name == "current.regent.eth"))
  end
end
