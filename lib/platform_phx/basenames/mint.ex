defmodule PlatformPhx.Basenames.Mint do
  use Ecto.Schema

  @primary_key {:id, :id, autogenerate: true}

  schema "basenames_mints" do
    field :parent_node, :string
    field :parent_name, :string
    field :label, :string
    field :fqdn, :string
    field :node, :string
    field :ens_fqdn, :string
    field :ens_node, :string
    field :owner_address, :string
    field :tx_hash, :string
    field :ens_tx_hash, :string
    field :ens_assigned_at, :utc_datetime
    field :payment_tx_hash, :string
    field :payment_chain_id, :integer
    field :price_wei, :integer
    field :is_free, :boolean
    field :is_in_use, :boolean

    timestamps(updated_at: false, type: :utc_datetime)
  end
end
