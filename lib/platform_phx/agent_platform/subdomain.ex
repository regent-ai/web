defmodule PlatformPhx.AgentPlatform.Subdomain do
  @moduledoc false
  use Ecto.Schema

  import Ecto.Changeset

  @primary_key {:id, :id, autogenerate: true}
  @foreign_key_type :id

  schema "platform_agent_subdomains" do
    field :slug, :string
    field :hostname, :string
    field :basename_fqdn, :string
    field :ens_fqdn, :string
    field :active, :boolean, default: false

    belongs_to :agent, PlatformPhx.AgentPlatform.Agent

    timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
  end

  def changeset(subdomain, attrs) do
    subdomain
    |> cast(attrs, [:agent_id, :slug, :hostname, :basename_fqdn, :ens_fqdn, :active])
    |> validate_required([:agent_id, :slug, :hostname, :basename_fqdn, :ens_fqdn])
    |> unique_constraint(:agent_id)
    |> unique_constraint(:slug)
    |> unique_constraint(:hostname)
  end
end
