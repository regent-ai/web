defmodule PlatformPhx.Basenames.MintAllowance do
  @moduledoc false
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false

  @type t :: %__MODULE__{
          parent_node: String.t() | nil,
          parent_name: String.t() | nil,
          address: String.t() | nil,
          snapshot_block_number: integer() | nil,
          snapshot_total: integer() | nil,
          free_mints_used: integer() | nil,
          created_at: DateTime.t() | nil,
          updated_at: DateTime.t() | nil
        }

  schema "basenames_mint_allowances" do
    field :parent_node, :string
    field :parent_name, :string
    field :address, :string
    field :snapshot_block_number, :integer
    field :snapshot_total, :integer
    field :free_mints_used, :integer

    timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
  end

  @required_fields ~w(
    parent_node
    parent_name
    address
    snapshot_block_number
    snapshot_total
    free_mints_used
  )a

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(allowance, attrs) do
    allowance
    |> cast(attrs, @required_fields)
    |> validate_required(@required_fields)
  end
end
