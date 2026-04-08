defmodule PlatformPhx.AgentPlatform.Job do
  @moduledoc false
  use Ecto.Schema

  import Ecto.Changeset

  @primary_key {:id, :id, autogenerate: true}
  @foreign_key_type :id

  schema "platform_agent_jobs" do
    field :external_job_id, :string
    field :title, :string
    field :summary, :string
    field :status, :string
    field :requested_by, :string
    field :public_result, :boolean, default: true
    field :completed_at, :utc_datetime

    belongs_to :agent, PlatformPhx.AgentPlatform.Agent

    timestamps(inserted_at: :created_at, updated_at: :updated_at, type: :utc_datetime)
  end

  def changeset(job, attrs) do
    job
    |> cast(attrs, [
      :agent_id,
      :external_job_id,
      :title,
      :summary,
      :status,
      :requested_by,
      :public_result,
      :completed_at
    ])
    |> validate_required([:agent_id, :title, :summary, :status])
  end
end
