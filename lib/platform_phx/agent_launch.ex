defmodule PlatformPhx.AgentLaunch do
  @moduledoc false

  import Ecto.Query, warn: false

  alias PlatformPhx.AgentLaunch.Auction
  alias PlatformPhx.Repo

  @type auction :: map()
  @type auction_payload :: %{
          required(:auctions) => [map()],
          required(:generated_at) => DateTime.t()
        }
  @type auction_split :: %{required(:current) => [map()], required(:past) => [map()]}

  @default_auctions [
    %{
      "id" => "cca-eth-genesis",
      "agent_id" => "8543:4113",
      "agent_name" => "demo.regent.eth",
      "owner_address" => "0x2f4f9d5A72C09D2AF8Eaf9A69b8d5D8cF20ab6F3",
      "auction_address" => "0x608c4e792C65f5527B3f70715deA44d3b302F4Ee",
      "token_address" => nil,
      "network" => "ethereum",
      "status" => "active",
      "started_at" => "2026-03-29T08:00:00Z",
      "ends_at" => "2026-03-30T10:00:00Z",
      "claim_at" => nil,
      "bidders" => 42,
      "raised_currency" => "238.14 ETH",
      "target_currency" => "400 ETH",
      "progress_percent" => 60,
      "notes" => "Genesis Regent CCA auction mirrored into launchboard."
    },
    %{
      "id" => "cca-base-alpha",
      "agent_id" => "8453:133",
      "agent_name" => "demo.regent.eth",
      "owner_address" => "0x2f4f9d5A72C09D2AF8Eaf9A69b8d5D8cF20ab6F3",
      "auction_address" => "0x3E13B8C88f62Ec49f4F67b98D76460d9d8f5A710",
      "token_address" => nil,
      "network" => "base",
      "status" => "ending-soon",
      "started_at" => "2026-03-28T20:00:00Z",
      "ends_at" => "2026-03-29T16:00:00Z",
      "claim_at" => nil,
      "bidders" => 19,
      "raised_currency" => "112.93 ETH",
      "target_currency" => "150 ETH",
      "progress_percent" => 75,
      "notes" => "Base pilot auction with reduced block window."
    }
  ]

  @spec list_auctions() :: [auction()]
  def list_auctions do
    case Repo.all(from auction in Auction, order_by: [asc: auction.ends_at]) do
      [] -> Enum.map(@default_auctions, &normalize_map/1)
      auctions -> Enum.map(auctions, &normalize_auction/1)
    end
  end

  @spec split_auctions([auction()]) :: auction_split()
  def split_auctions(auctions) do
    now = DateTime.utc_now()

    Enum.reduce(auctions, %{current: [], past: []}, fn auction, acc ->
      past? =
        auction.status == "settled" or
          (match?(%DateTime{}, auction.ends_at) and DateTime.compare(auction.ends_at, now) != :gt)

      if past? do
        %{acc | past: [auction | acc.past]}
      else
        %{acc | current: [auction | acc.current]}
      end
    end)
    |> then(fn %{current: current, past: past} ->
      %{
        current: Enum.sort_by(current, & &1.ends_at, DateTime),
        past: Enum.sort_by(past, & &1.ends_at, {:desc, DateTime})
      }
    end)
  end

  @spec generated_payload() :: auction_payload()
  def generated_payload do
    list_auctions()
    |> generated_payload()
  end

  @spec generated_payload([auction()]) :: auction_payload()
  def generated_payload(auctions) do
    %{
      auctions: Enum.map(auctions, &public_auction/1),
      generated_at: DateTime.utc_now()
    }
  end

  @spec public_auction(auction()) :: map()
  def public_auction(auction) do
    %{
      id: auction.id,
      agent_id: auction.agent_id,
      agent_name: auction.agent_name,
      owner_address: auction.owner_address,
      auction_address: auction.auction_address,
      token_address: auction.token_address,
      network: auction.network,
      status: auction.status,
      started_at: iso_or_nil(auction.started_at),
      ends_at: iso_or_nil(auction.ends_at),
      claim_at: iso_or_nil(auction.claim_at),
      bidders: auction.bidders,
      raised_currency: auction.raised_currency,
      target_currency: auction.target_currency,
      progress_percent: auction.progress_percent,
      notes: auction.notes,
      uniswap_url: auction.uniswap_url
    }
  end

  defp normalize_auction(%Auction{} = auction), do: auction

  defp normalize_map(map) do
    %{
      id: map["id"],
      agent_id: map["agent_id"],
      agent_name: map["agent_name"],
      owner_address: map["owner_address"],
      auction_address: map["auction_address"],
      token_address: map["token_address"],
      network: map["network"],
      status: map["status"],
      started_at: parse_datetime(map["started_at"]),
      ends_at: parse_datetime(map["ends_at"]),
      claim_at: parse_datetime(map["claim_at"]),
      bidders: map["bidders"],
      raised_currency: map["raised_currency"],
      target_currency: map["target_currency"],
      progress_percent: map["progress_percent"],
      notes: map["notes"],
      uniswap_url: map["uniswap_url"]
    }
  end

  defp parse_datetime(nil), do: nil

  defp parse_datetime(value) when is_binary(value) do
    {:ok, dt, _} = DateTime.from_iso8601(value)
    dt
  end

  defp iso_or_nil(nil), do: nil
  defp iso_or_nil(%DateTime{} = value), do: DateTime.to_iso8601(value)
end
