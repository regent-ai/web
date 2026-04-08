defmodule PlatformPhx.AgentPlatform.Connection do
  @moduledoc false
  use Ecto.Schema

  import Ecto.Changeset

  @primary_key {:id, :id, autogenerate: true}
  @foreign_key_type :id

  schema "platform_agent_connections" do
    field :kind, :string
    field :status, :string
    field :display_name, :string
    field :external_ref, :string
    field :details, :map, default: %{}
    field :connected_at, :utc_datetime

    belongs_to :agent, PlatformPhx.AgentPlatform.Agent

    timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
  end

  def changeset(connection, attrs) do
    connection
    |> cast(attrs, [
      :agent_id,
      :kind,
      :status,
      :display_name,
      :external_ref,
      :details,
      :connected_at
    ])
    |> validate_required([:agent_id, :kind, :status])
    |> validate_inclusion(:kind, ["wallet", "x", "slack", "payments"])
    |> validate_inclusion(:status, ["pending", "connected", "action_required"])
    |> unique_constraint([:agent_id, :kind],
      name: :platform_agent_connections_agent_id_kind_index
    )
  end
end
