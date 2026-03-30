defmodule PlatformPhx.Basenames.PaymentCredit do
  use Ecto.Schema

  @primary_key {:id, :id, autogenerate: true}

  schema "basenames_payment_credits" do
    field :parent_node, :string
    field :parent_name, :string
    field :address, :string
    field :payment_tx_hash, :string
    field :payment_chain_id, :integer
    field :price_wei, :integer
    field :consumed_at, :utc_datetime
    field :consumed_node, :string
    field :consumed_fqdn, :string

    timestamps(updated_at: false, type: :utc_datetime)
  end
end
