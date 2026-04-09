defmodule PlatformPhx.Repo.Migrations.AlignPlatformAgentsWithCurrentFoundryShape do
  use Ecto.Migration

  def up do
    create_if_not_exists table(:platform_human_users) do
      add :privy_user_id, :string, null: false
      add :wallet_address, :string
      add :wallet_addresses, {:array, :string}, null: false, default: []
      add :display_name, :string
      add :stripe_llm_billing_status, :string, null: false, default: "action_required"
      add :stripe_llm_external_ref, :string

      timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
    end

    create_if_not_exists unique_index(:platform_human_users, [:privy_user_id])

    create_if_not_exists table(:platform_agents) do
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

    create_if_not_exists unique_index(:platform_agents, [:slug])
    create_if_not_exists unique_index(:platform_agents, [:claimed_label])
    create_if_not_exists index(:platform_agents, [:owner_human_id])
    create_if_not_exists index(:platform_agents, [:status])
    create_if_not_exists index(:platform_agents, [:runtime_status])
    create_if_not_exists index(:platform_agents, [:sprite_metering_status])

    create_if_not_exists table(:platform_agent_subdomains) do
      add :agent_id, references(:platform_agents, on_delete: :delete_all), null: false
      add :slug, :string, null: false
      add :hostname, :string, null: false
      add :basename_fqdn, :string, null: false
      add :ens_fqdn, :string, null: false
      add :active, :boolean, null: false, default: false

      timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
    end

    create_if_not_exists unique_index(:platform_agent_subdomains, [:agent_id])
    create_if_not_exists unique_index(:platform_agent_subdomains, [:slug])
    create_if_not_exists unique_index(:platform_agent_subdomains, [:hostname])

    create_if_not_exists table(:platform_agent_services) do
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

    create_if_not_exists unique_index(:platform_agent_services, [:agent_id, :slug])
    create_if_not_exists index(:platform_agent_services, [:agent_id, :sort_order])

    create_if_not_exists table(:platform_agent_jobs) do
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

    create_if_not_exists index(:platform_agent_jobs, [:agent_id, :created_at])

    create_if_not_exists table(:platform_agent_artifacts) do
      add :agent_id, references(:platform_agents, on_delete: :delete_all), null: false
      add :job_id, references(:platform_agent_jobs, on_delete: :delete_all)
      add :title, :string, null: false
      add :summary, :text, null: false
      add :url, :string
      add :visibility, :string, null: false, default: "public"
      add :published_at, :utc_datetime

      timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
    end

    create_if_not_exists index(:platform_agent_artifacts, [:agent_id, :published_at])

    create_if_not_exists table(:platform_agent_connections) do
      add :agent_id, references(:platform_agents, on_delete: :delete_all), null: false
      add :kind, :string, null: false
      add :status, :string, null: false, default: "pending"
      add :display_name, :string
      add :external_ref, :string
      add :details, :map, null: false, default: %{}
      add :connected_at, :utc_datetime

      timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
    end

    create_if_not_exists unique_index(:platform_agent_connections, [:agent_id, :kind])
    create_if_not_exists index(:platform_agent_connections, [:kind, :status])

    execute("""
    ALTER TABLE platform_human_users
      ADD COLUMN IF NOT EXISTS stripe_llm_billing_status varchar(255) DEFAULT 'action_required',
      ADD COLUMN IF NOT EXISTS stripe_llm_external_ref varchar(255)
    """)

    execute("""
    ALTER TABLE platform_agents
      ADD COLUMN IF NOT EXISTS template_key varchar(255),
      ADD COLUMN IF NOT EXISTS name varchar(255),
      ADD COLUMN IF NOT EXISTS slug varchar(255),
      ADD COLUMN IF NOT EXISTS claimed_label varchar(255),
      ADD COLUMN IF NOT EXISTS basename_fqdn varchar(255),
      ADD COLUMN IF NOT EXISTS ens_fqdn varchar(255),
      ADD COLUMN IF NOT EXISTS status varchar(255) DEFAULT 'published',
      ADD COLUMN IF NOT EXISTS public_summary text,
      ADD COLUMN IF NOT EXISTS hero_statement text,
      ADD COLUMN IF NOT EXISTS sprite_name varchar(255),
      ADD COLUMN IF NOT EXISTS sprite_url varchar(255),
      ADD COLUMN IF NOT EXISTS stripe_llm_billing_status varchar(255) DEFAULT 'action_required',
      ADD COLUMN IF NOT EXISTS stripe_llm_external_ref varchar(255),
      ADD COLUMN IF NOT EXISTS sprite_free_until timestamp with time zone,
      ADD COLUMN IF NOT EXISTS sprite_credit_balance_usd_cents integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS sprite_metering_status varchar(255) DEFAULT 'trialing',
      ADD COLUMN IF NOT EXISTS paperclip_url varchar(255),
      ADD COLUMN IF NOT EXISTS paperclip_company_id varchar(255),
      ADD COLUMN IF NOT EXISTS paperclip_agent_id varchar(255),
      ADD COLUMN IF NOT EXISTS runtime_status varchar(255) DEFAULT 'ready',
      ADD COLUMN IF NOT EXISTS checkpoint_status varchar(255) DEFAULT 'ready',
      ADD COLUMN IF NOT EXISTS wallet_address varchar(255),
      ADD COLUMN IF NOT EXISTS published_at timestamp with time zone
    """)

    execute("""
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'platform_agents'
          AND column_name = 'runtime_host'
      ) THEN
        EXECUTE $sql$
          UPDATE platform_agents
          SET sprite_name = COALESCE(sprite_name, slug || '-sprite'),
              sprite_url = COALESCE(sprite_url, runtime_host, 'https://' || slug || '.sprites.dev'),
              paperclip_url = COALESCE(paperclip_url, runtime_host, 'https://' || slug || '.sprites.dev'),
              paperclip_company_id = COALESCE(paperclip_company_id, slug || '-company'),
              paperclip_agent_id = COALESCE(paperclip_agent_id, slug || '-hermes'),
              runtime_status = COALESCE(runtime_status, 'ready'),
              checkpoint_status = COALESCE(checkpoint_status, 'ready')
        $sql$;
      ELSE
        EXECUTE $sql$
          UPDATE platform_agents
          SET sprite_name = COALESCE(sprite_name, slug || '-sprite'),
              sprite_url = COALESCE(sprite_url, 'https://' || slug || '.sprites.dev'),
              paperclip_url = COALESCE(paperclip_url, 'https://' || slug || '.sprites.dev'),
              paperclip_company_id = COALESCE(paperclip_company_id, slug || '-company'),
              paperclip_agent_id = COALESCE(paperclip_agent_id, slug || '-hermes'),
              runtime_status = COALESCE(runtime_status, 'ready'),
              checkpoint_status = COALESCE(checkpoint_status, 'ready')
        $sql$;
      END IF;
    END
    $$;
    """)

    execute("""
    ALTER TABLE platform_agents
      ALTER COLUMN status SET DEFAULT 'published',
      ALTER COLUMN runtime_status SET DEFAULT 'ready',
      ALTER COLUMN runtime_status SET NOT NULL,
      ALTER COLUMN checkpoint_status SET DEFAULT 'ready',
      ALTER COLUMN checkpoint_status SET NOT NULL
    """)

    create_if_not_exists index(:platform_agents, [:runtime_status])

    execute("""
    ALTER TABLE platform_agents
      DROP COLUMN IF EXISTS runtime_host
    """)
  end

  def down do
    execute("""
    ALTER TABLE platform_agents
      ADD COLUMN IF NOT EXISTS runtime_host varchar(255)
    """)

    execute("""
    UPDATE platform_agents
    SET runtime_host = COALESCE(runtime_host, sprite_url, paperclip_url, 'https://' || slug || '.sprites.dev')
    """)

    drop_if_exists index(:platform_agents, [:runtime_status])

    execute("""
    ALTER TABLE platform_agents
      DROP COLUMN IF EXISTS checkpoint_status,
      DROP COLUMN IF EXISTS runtime_status,
      DROP COLUMN IF EXISTS paperclip_agent_id,
      DROP COLUMN IF EXISTS paperclip_company_id,
      DROP COLUMN IF EXISTS paperclip_url,
      DROP COLUMN IF EXISTS sprite_url,
      DROP COLUMN IF EXISTS sprite_name
    """)
  end
end
