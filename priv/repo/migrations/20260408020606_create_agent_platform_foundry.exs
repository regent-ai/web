defmodule PlatformPhx.Repo.Migrations.CreateAgentPlatformFoundry do
  use Ecto.Migration

  def change do
    create table(:platform_human_users) do
      add :privy_user_id, :string, null: false
      add :wallet_address, :string
      add :wallet_addresses, {:array, :string}, null: false, default: []
      add :display_name, :string
      add :stripe_llm_billing_status, :string, null: false, default: "action_required"
      add :stripe_llm_external_ref, :string

      timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
    end

    create unique_index(:platform_human_users, [:privy_user_id])

    create table(:platform_agents) do
      add :owner_human_id, references(:platform_human_users, on_delete: :delete_all)
      add :template_key, :string, null: false
      add :name, :string, null: false
      add :slug, :string, null: false
      add :claimed_label, :string, null: false
      add :basename_fqdn, :string, null: false
      add :ens_fqdn, :string, null: false
      add :status, :string, null: false, default: "published"
      add :public_summary, :text, null: false
      add :hero_statement, :text
      add :sprite_name, :string
      add :sprite_url, :string
      add :stripe_llm_billing_status, :string, null: false, default: "action_required"
      add :stripe_llm_external_ref, :string
      add :sprite_free_until, :utc_datetime
      add :sprite_credit_balance_usd_cents, :integer, null: false, default: 0
      add :sprite_metering_status, :string, null: false, default: "trialing"
      add :paperclip_url, :string
      add :paperclip_company_id, :string
      add :paperclip_agent_id, :string
      add :runtime_status, :string, null: false, default: "ready"
      add :checkpoint_status, :string, null: false, default: "ready"
      add :wallet_address, :string
      add :published_at, :utc_datetime

      timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
    end

    create unique_index(:platform_agents, [:slug])
    create unique_index(:platform_agents, [:claimed_label])
    create index(:platform_agents, [:owner_human_id])
    create index(:platform_agents, [:status])
    create index(:platform_agents, [:runtime_status])
    create index(:platform_agents, [:sprite_metering_status])

    create table(:platform_agent_subdomains) do
      add :agent_id, references(:platform_agents, on_delete: :delete_all), null: false
      add :slug, :string, null: false
      add :hostname, :string, null: false
      add :basename_fqdn, :string, null: false
      add :ens_fqdn, :string, null: false
      add :active, :boolean, null: false, default: false

      timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
    end

    create unique_index(:platform_agent_subdomains, [:agent_id])
    create unique_index(:platform_agent_subdomains, [:slug])
    create unique_index(:platform_agent_subdomains, [:hostname])

    create table(:platform_agent_services) do
      add :agent_id, references(:platform_agents, on_delete: :delete_all), null: false
      add :slug, :string, null: false
      add :name, :string, null: false
      add :summary, :text, null: false
      add :price_label, :string, null: false
      add :payment_rail, :string, null: false
      add :delivery_mode, :string, null: false
      add :public_result_default, :boolean, null: false, default: true
      add :sort_order, :integer, null: false, default: 0

      timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
    end

    create unique_index(:platform_agent_services, [:agent_id, :slug])
    create index(:platform_agent_services, [:agent_id, :sort_order])

    create table(:platform_agent_jobs) do
      add :agent_id, references(:platform_agents, on_delete: :delete_all), null: false
      add :external_job_id, :string
      add :title, :string, null: false
      add :summary, :text, null: false
      add :status, :string, null: false, default: "queued"
      add :requested_by, :string
      add :public_result, :boolean, null: false, default: true
      add :completed_at, :utc_datetime

      timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
    end

    create index(:platform_agent_jobs, [:agent_id, :created_at])

    create table(:platform_agent_artifacts) do
      add :agent_id, references(:platform_agents, on_delete: :delete_all), null: false
      add :job_id, references(:platform_agent_jobs, on_delete: :delete_all)
      add :title, :string, null: false
      add :summary, :text, null: false
      add :url, :string
      add :visibility, :string, null: false, default: "public"
      add :published_at, :utc_datetime

      timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
    end

    create index(:platform_agent_artifacts, [:agent_id, :published_at])

    create table(:platform_agent_connections) do
      add :agent_id, references(:platform_agents, on_delete: :delete_all), null: false
      add :kind, :string, null: false
      add :status, :string, null: false, default: "pending"
      add :display_name, :string
      add :external_ref, :string
      add :details, :map, null: false, default: %{}
      add :connected_at, :utc_datetime

      timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
    end

    create unique_index(:platform_agent_connections, [:agent_id, :kind])
    create index(:platform_agent_connections, [:kind, :status])
  end
end
