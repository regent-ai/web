defmodule PlatformPhx.Basenames.MintAllowance do
  use Ecto.Schema

  @primary_key false

  schema "basenames_mint_allowances" do
    field :parent_node, :string
    field :parent_name, :string
    field :address, :string
    field :snapshot_block_number, :integer
    field :snapshot_total, :integer
    field :free_mints_used, :integer

    timestamps(type: :utc_datetime)
  end
end
