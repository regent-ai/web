defmodule PlatformPhx.AgentPlatform.Agent do
  @moduledoc false
  use Ecto.Schema

  import Ecto.Changeset

  alias PlatformPhx.AgentPlatform.Artifact
  alias PlatformPhx.AgentPlatform.Connection
  alias PlatformPhx.AgentPlatform.Job
  alias PlatformPhx.AgentPlatform.Service
  alias PlatformPhx.AgentPlatform.Subdomain

  @primary_key {:id, :id, autogenerate: true}
  @foreign_key_type :id

  schema "platform_agents" do
    field :template_key, :string
    field :name, :string
    field :slug, :string
    field :claimed_label, :string
    field :basename_fqdn, :string
    field :ens_fqdn, :string
    field :status, :string
    field :public_summary, :string
    field :hero_statement, :string
    field :sprite_name, :string
    field :sprite_url, :string
    field :paperclip_url, :string
    field :paperclip_company_id, :string
    field :paperclip_agent_id, :string
    field :runtime_status, :string, default: "ready"
    field :checkpoint_status, :string, default: "ready"
    field :stripe_llm_billing_status, :string, default: "action_required"
    field :stripe_llm_external_ref, :string
    field :sprite_free_until, :utc_datetime
    field :sprite_credit_balance_usd_cents, :integer, default: 0
    field :sprite_metering_status, :string, default: "trialing"
    field :wallet_address, :string
    field :published_at, :utc_datetime

    belongs_to :owner_human, PlatformPhx.Accounts.HumanUser
    has_one :subdomain, Subdomain
    has_many :services, Service
    has_many :jobs, Job
    has_many :artifacts, Artifact
    has_many :connections, Connection

    timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
  end

  def changeset(agent, attrs) do
    agent
    |> cast(attrs, [
      :owner_human_id,
      :template_key,
      :name,
      :slug,
      :claimed_label,
      :basename_fqdn,
      :ens_fqdn,
      :status,
      :public_summary,
      :hero_statement,
      :sprite_name,
      :sprite_url,
      :paperclip_url,
      :paperclip_company_id,
      :paperclip_agent_id,
      :runtime_status,
      :checkpoint_status,
      :stripe_llm_billing_status,
      :stripe_llm_external_ref,
      :sprite_free_until,
      :sprite_credit_balance_usd_cents,
      :sprite_metering_status,
      :wallet_address,
      :published_at
    ])
    |> validate_required([
      :template_key,
      :name,
      :slug,
      :claimed_label,
      :basename_fqdn,
      :ens_fqdn,
      :status,
      :public_summary
    ])
    |> validate_length(:slug, min: 2, max: 63)
    |> validate_length(:name, max: 120)
    |> validate_length(:template_key, max: 80)
    |> validate_inclusion(:status, ["published"])
    |> validate_inclusion(:runtime_status, [
      "ready",
      "provisioning",
      "action_required",
      "paused_for_credits"
    ])
    |> validate_inclusion(:checkpoint_status, ["ready", "pending", "action_required"])
    |> validate_inclusion(:stripe_llm_billing_status, ["action_required", "connected"])
    |> validate_inclusion(:sprite_metering_status, ["trialing", "paid", "paused"])
    |> unique_constraint(:slug)
    |> unique_constraint(:claimed_label)
  end
end
