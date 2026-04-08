defmodule PlatformPhx.Accounts.HumanUser do
  @moduledoc false
  use Ecto.Schema

  import Ecto.Changeset

  @primary_key {:id, :id, autogenerate: true}

  schema "platform_human_users" do
    field :privy_user_id, :string
    field :wallet_address, :string
    field :wallet_addresses, {:array, :string}, default: []
    field :display_name, :string
    field :role, :string, default: "user"
    field :stripe_llm_billing_status, :string, default: "action_required"
    field :stripe_llm_external_ref, :string

    timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
  end

  def changeset(human, attrs) do
    human
    |> cast(attrs, [
      :privy_user_id,
      :wallet_address,
      :wallet_addresses,
      :display_name,
      :role,
      :stripe_llm_billing_status,
      :stripe_llm_external_ref
    ])
    |> validate_required([:privy_user_id])
    |> validate_length(:display_name, max: 80)
    |> validate_inclusion(:role, ["admin", "operator", "user"])
    |> validate_inclusion(:stripe_llm_billing_status, ["action_required", "connected"])
    |> unique_constraint(:privy_user_id)
  end
end
