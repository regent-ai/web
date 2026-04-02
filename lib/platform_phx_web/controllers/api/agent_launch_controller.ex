defmodule PlatformPhxWeb.Api.AgentLaunchController do
  use PlatformPhxWeb, :controller

  alias PlatformPhx.AgentLaunch

  @spec auctions(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def auctions(conn, _params) do
    payload = AgentLaunch.generated_payload()

    json(conn, %{
      "auctions" => Enum.map(payload.auctions, &camelize_auction/1),
      "generatedAt" => DateTime.to_iso8601(payload.generated_at)
    })
  end

  defp camelize_auction(auction) do
    %{
      "id" => auction.id,
      "agentId" => auction.agent_id,
      "agentName" => auction.agent_name,
      "ownerAddress" => auction.owner_address,
      "auctionAddress" => auction.auction_address,
      "tokenAddress" => auction.token_address,
      "network" => auction.network,
      "status" => auction.status,
      "startedAt" => auction.started_at,
      "endsAt" => auction.ends_at,
      "claimAt" => auction.claim_at,
      "bidders" => auction.bidders,
      "raisedCurrency" => auction.raised_currency,
      "targetCurrency" => auction.target_currency,
      "progressPercent" => auction.progress_percent,
      "notes" => auction.notes,
      "uniswapUrl" => auction.uniswap_url
    }
  end
end
