defmodule PlatformPhx.Repo.Migrations.CreateOperatorReports do
  use Ecto.Migration

  def change do
    create table(:agent_bug_reports) do
      add :report_id, :string, null: false
      add :summary, :text, null: false
      add :details, :text, null: false
      add :status, :string, size: 24, null: false, default: "pending"
      add :reporter_wallet_address, :string, size: 42, null: false
      add :reporter_chain_id, :integer, null: false
      add :reporter_registry_address, :string, size: 42, null: false
      add :reporter_token_id, :string, size: 128, null: false
      add :reporter_label, :string, size: 255

      timestamps(type: :utc_datetime, inserted_at: :created_at, updated_at: :updated_at)
    end

    create unique_index(:agent_bug_reports, [:report_id],
             name: :agent_bug_reports_report_id_unique
           )

    create index(:agent_bug_reports, [:created_at], name: :agent_bug_reports_created_at_idx)
    create index(:agent_bug_reports, [:status], name: :agent_bug_reports_status_idx)

    create constraint(
             :agent_bug_reports,
             :agent_bug_reports_status_check,
             check: "status IN ('pending', 'fixed', 'won''t fix', 'duplicate')"
           )

    create table(:agent_security_reports) do
      add :report_id, :string, null: false
      add :summary, :text, null: false
      add :details, :text, null: false
      add :contact, :text, null: false
      add :reporter_wallet_address, :string, size: 42, null: false
      add :reporter_chain_id, :integer, null: false
      add :reporter_registry_address, :string, size: 42, null: false
      add :reporter_token_id, :string, size: 128, null: false
      add :reporter_label, :string, size: 255

      timestamps(type: :utc_datetime, inserted_at: :created_at, updated_at: :updated_at)
    end

    create unique_index(
             :agent_security_reports,
             [:report_id],
             name: :agent_security_reports_report_id_unique
           )

    create index(
             :agent_security_reports,
             [:created_at],
             name: :agent_security_reports_created_at_idx
           )
  end
end
