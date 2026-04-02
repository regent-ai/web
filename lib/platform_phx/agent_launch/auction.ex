defmodule PlatformPhx.AgentLaunch.Auction do
  use Ecto.Schema

  @primary_key {:id, :id, autogenerate: true}
  @foreign_key_type :id

  @type t :: %__MODULE__{
          id: integer() | nil,
          source_job_id: String.t() | nil,
          agent_id: String.t() | nil,
          agent_name: String.t() | nil,
          owner_address: String.t() | nil,
          auction_address: String.t() | nil,
          token_address: String.t() | nil,
          network: String.t() | nil,
          chain_id: integer() | nil,
          status: String.t() | nil,
          started_at: DateTime.t() | nil,
          ends_at: DateTime.t() | nil,
          claim_at: DateTime.t() | nil,
          bidders: integer() | nil,
          raised_currency: String.t() | nil,
          target_currency: String.t() | nil,
          progress_percent: integer() | nil,
          notes: String.t() | nil,
          uniswap_url: String.t() | nil,
          created_at: DateTime.t() | nil,
          updated_at: DateTime.t() | nil
        }

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

    timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
  end
end
