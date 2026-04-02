defmodule PlatformPhx.Basenames.PaymentCredit do
  @moduledoc false
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :id, autogenerate: true}

  @type t :: %__MODULE__{
          id: integer() | nil,
          parent_node: String.t() | nil,
          parent_name: String.t() | nil,
          address: String.t() | nil,
          payment_tx_hash: String.t() | nil,
          payment_chain_id: integer() | nil,
          price_wei: integer() | nil,
          consumed_at: DateTime.t() | nil,
          consumed_node: String.t() | nil,
          consumed_fqdn: String.t() | nil,
          created_at: DateTime.t() | nil
        }

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

    timestamps(inserted_at: :created_at, updated_at: false, type: :utc_datetime)
  end

  @required_fields ~w(parent_node parent_name address payment_tx_hash price_wei)a
  @optional_fields ~w(payment_chain_id consumed_at consumed_node consumed_fqdn)a

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(credit, attrs) do
    credit
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> unique_constraint(:payment_tx_hash, name: :basenames_payment_credits_tx_unique)
  end
end
