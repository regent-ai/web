defmodule PlatformPhx.AgentPlatform.Service do
  @moduledoc false
  use Ecto.Schema

  import Ecto.Changeset

  @primary_key {:id, :id, autogenerate: true}
  @foreign_key_type :id

  schema "platform_agent_services" do
    field :slug, :string
    field :name, :string
    field :summary, :string
    field :price_label, :string
    field :payment_rail, :string
    field :delivery_mode, :string
    field :public_result_default, :boolean, default: true
    field :sort_order, :integer, default: 0

    belongs_to :agent, PlatformPhx.AgentPlatform.Agent

    timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
  end

  def changeset(service, attrs) do
    service
    |> cast(attrs, [
      :agent_id,
      :slug,
      :name,
      :summary,
      :price_label,
      :payment_rail,
      :delivery_mode,
      :public_result_default,
      :sort_order
    ])
    |> validate_required([
      :agent_id,
      :slug,
      :name,
      :summary,
      :price_label,
      :payment_rail,
      :delivery_mode
    ])
    |> validate_inclusion(:payment_rail, ["x402", "MPP"])
    |> unique_constraint([:agent_id, :slug], name: :platform_agent_services_agent_id_slug_index)
  end
end
