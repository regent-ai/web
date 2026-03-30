defmodule PlatformPhx.AgentLaunch.Auction do
  use Ecto.Schema

  @primary_key {:id, :id, autogenerate: true}
  @foreign_key_type :id

  schema "agentlaunch_auctions" do
    field :source_job_id, :string
    field :agent_id, :string
    field :agent_name, :string
    field :owner_address, :string
    field :auction_address, :string
    field :token_address, :string
    field :network, :string
    field :chain_id, :integer
    field :status, :string
    field :started_at, :utc_datetime
    field :ends_at, :utc_datetime
    field :claim_at, :utc_datetime
    field :bidders, :integer
    field :raised_currency, :string
    field :target_currency, :string
    field :progress_percent, :integer
    field :notes, :string
    field :uniswap_url, :string

    timestamps(type: :utc_datetime)
  end
end
