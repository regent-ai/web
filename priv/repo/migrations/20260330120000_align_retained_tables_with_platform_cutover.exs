defmodule PlatformPhx.Repo.Migrations.AlignRetainedTablesWithPlatformCutover do
  use Ecto.Migration

  def up do
    rename_inserted_at("basenames_mint_allowances")
    rename_inserted_at("basenames_mints")
    rename_inserted_at("basenames_payment_credits")
    rename_inserted_at("agentlaunch_auctions")

    ensure_timestamptz("basenames_mint_allowances", "created_at")
    ensure_timestamptz("basenames_mint_allowances", "updated_at")

    ensure_timestamptz("basenames_mints", "created_at")
    ensure_timestamptz("basenames_mints", "ens_assigned_at")

    ensure_timestamptz("basenames_payment_credits", "created_at")
    ensure_timestamptz("basenames_payment_credits", "consumed_at")

    ensure_timestamptz("agentlaunch_auctions", "started_at")
    ensure_timestamptz("agentlaunch_auctions", "ends_at")
    ensure_timestamptz("agentlaunch_auctions", "claim_at")
    ensure_timestamptz("agentlaunch_auctions", "created_at")
    ensure_timestamptz("agentlaunch_auctions", "updated_at")

    ensure_default_now("basenames_mint_allowances", "created_at")
    ensure_default_now("basenames_mint_allowances", "updated_at")
    ensure_default_now("basenames_mints", "created_at")
    ensure_default_now("basenames_payment_credits", "created_at")
    ensure_default_now("agentlaunch_auctions", "created_at")
    ensure_default_now("agentlaunch_auctions", "updated_at")
  end

  def down, do: :ok

  defp rename_inserted_at(table_name) do
    execute("""
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = '#{table_name}'
          AND column_name = 'inserted_at'
      ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = '#{table_name}'
          AND column_name = 'created_at'
      ) THEN
        EXECUTE 'ALTER TABLE #{table_name} RENAME COLUMN inserted_at TO created_at';
      END IF;
    END
    $$;
    """)
  end

  defp ensure_timestamptz(table_name, column_name) do
    execute("""
    DO $$
    DECLARE
      current_type text;
    BEGIN
      SELECT data_type
      INTO current_type
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = '#{table_name}'
        AND column_name = '#{column_name}';

      IF current_type = 'timestamp without time zone' THEN
        EXECUTE 'ALTER TABLE #{table_name} ALTER COLUMN #{column_name} TYPE timestamp with time zone USING #{column_name} AT TIME ZONE ''UTC''';
      END IF;
    END
    $$;
    """)
  end

  defp ensure_default_now(table_name, column_name) do
    execute("""
    ALTER TABLE #{table_name}
    ALTER COLUMN #{column_name} SET DEFAULT now()
    """)
  end
end
