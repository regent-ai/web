defmodule PlatformPhx.OperatorReports.BugReport do
  @moduledoc false
  use Ecto.Schema
  import Ecto.Changeset

  alias PlatformPhx.OperatorReports.ReportText

  @primary_key {:id, :id, autogenerate: true}

  @statuses ["pending", "fixed", "won't fix", "duplicate"]
  @address_pattern ~r/^0x[a-fA-F0-9]{40}$/

  @type t :: %__MODULE__{
          id: integer() | nil,
          report_id: String.t() | nil,
          summary: String.t() | nil,
          details: String.t() | nil,
          status: String.t() | nil,
          reporter_wallet_address: String.t() | nil,
          reporter_chain_id: integer() | nil,
          reporter_registry_address: String.t() | nil,
          reporter_token_id: String.t() | nil,
          reporter_label: String.t() | nil,
          created_at: DateTime.t() | nil,
          updated_at: DateTime.t() | nil
        }

  schema "agent_bug_reports" do
    field :report_id, :string
    field :summary, :string
    field :details, :string
    field :status, :string, default: "pending"
    field :reporter_wallet_address, :string
    field :reporter_chain_id, :integer
    field :reporter_registry_address, :string
    field :reporter_token_id, :string
    field :reporter_label, :string

    timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
  end

  @required_fields ~w(
    report_id
    summary
    details
    status
    reporter_wallet_address
    reporter_chain_id
    reporter_registry_address
    reporter_token_id
  )a
  @optional_fields ~w(reporter_label)a
  @sanitized_fields ~w(summary details reporter_label)a

  @spec statuses() :: [String.t()]
  def statuses, do: @statuses

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(report, attrs) do
    report
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> ensure_report_id()
    |> sanitize_fields(@sanitized_fields)
    |> validate_required(@required_fields)
    |> validate_number(:reporter_chain_id, greater_than: 0)
    |> validate_length(:summary, max: 280)
    |> validate_length(:details, max: 20_000)
    |> validate_length(:reporter_token_id, max: 128)
    |> validate_length(:reporter_label, max: 255)
    |> validate_inclusion(:status, @statuses)
    |> validate_format(:reporter_wallet_address, @address_pattern)
    |> validate_format(:reporter_registry_address, @address_pattern)
    |> unique_constraint(:report_id, name: :agent_bug_reports_report_id_unique)
  end

  defp ensure_report_id(changeset) do
    case get_field(changeset, :report_id) do
      nil -> put_change(changeset, :report_id, Ecto.UUID.generate())
      "" -> put_change(changeset, :report_id, Ecto.UUID.generate())
      _value -> changeset
    end
  end

  defp sanitize_fields(changeset, fields) do
    Enum.reduce(fields, changeset, fn field, acc ->
      update_change(acc, field, &ReportText.sanitize/1)
    end)
  end
end
