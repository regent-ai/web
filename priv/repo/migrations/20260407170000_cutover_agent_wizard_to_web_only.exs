defmodule PlatformPhx.Repo.Migrations.CutoverAgentWizardToWebOnly do
  use Ecto.Migration

  def up do
    alter table(:platform_human_users) do
      add :stripe_llm_billing_status, :string, null: false, default: "action_required"
      add :stripe_llm_external_ref, :string
    end

    alter table(:platform_agents) do
      add :stripe_llm_billing_status, :string, null: false, default: "action_required"
      add :stripe_llm_external_ref, :string
      add :sprite_free_until, :utc_datetime
      add :sprite_credit_balance_usd_cents, :integer, null: false, default: 0
      add :sprite_metering_status, :string, null: false, default: "trialing"
    end

    execute("UPDATE platform_agents SET status = 'published'")

    execute("""
    UPDATE platform_agents
    SET stripe_llm_billing_status = 'connected',
        stripe_llm_external_ref = COALESCE(stripe_llm_external_ref, 'stripe-llm-agent-' || id),
        sprite_free_until = COALESCE(sprite_free_until, created_at + interval '1 day'),
        sprite_credit_balance_usd_cents = COALESCE(sprite_credit_balance_usd_cents, 0),
        sprite_metering_status = CASE
          WHEN COALESCE(sprite_credit_balance_usd_cents, 0) > 0 THEN 'paid'
          WHEN COALESCE(sprite_free_until, created_at + interval '1 day') > NOW() THEN 'trialing'
          ELSE 'paused'
        END
    """)

    execute("""
    ALTER TABLE platform_agents
      ALTER COLUMN status SET DEFAULT 'published'
    """)

    create_if_not_exists index(:platform_agents, [:sprite_metering_status])
  end

  def down do
    drop_if_exists index(:platform_agents, [:sprite_metering_status])

    execute("""
    ALTER TABLE platform_agents
      ALTER COLUMN status SET DEFAULT 'draft'
    """)

    alter table(:platform_agents) do
      remove :sprite_metering_status
      remove :sprite_credit_balance_usd_cents
      remove :sprite_free_until
      remove :stripe_llm_external_ref
      remove :stripe_llm_billing_status
    end

    alter table(:platform_human_users) do
      remove :stripe_llm_external_ref
      remove :stripe_llm_billing_status
    end
  end
end
