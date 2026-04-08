defmodule PlatformPhxWeb.Api.AgentPlatformController do
  use PlatformPhxWeb, :controller

  alias PlatformPhx.Accounts
  alias PlatformPhx.AgentPlatform
  alias PlatformPhxWeb.ApiErrors

  def templates(conn, _params) do
    json(conn, %{ok: true, templates: AgentPlatform.list_templates()})
  end

  def wizard(conn, _params) do
    conn
    |> current_human()
    |> AgentPlatform.wizard_payload()
    |> then(&ApiErrors.respond(conn, &1))
  end

  def llm_billing(conn, _params) do
    conn
    |> current_human()
    |> AgentPlatform.create_llm_billing_session()
    |> then(&ApiErrors.respond(conn, &1))
  end

  def resolve(conn, %{"host" => host}) do
    ApiErrors.respond(conn, AgentPlatform.resolve_host_payload(host))
  end

  def resolve(conn, _params) do
    ApiErrors.error(conn, {:bad_request, "Invalid host"})
  end

  def create_company(conn, params) do
    conn
    |> current_human()
    |> AgentPlatform.provision_company(params)
    |> then(&ApiErrors.respond(conn, &1))
  end

  def runtime(conn, %{"slug" => slug}) do
    conn
    |> current_human()
    |> AgentPlatform.runtime_payload(slug)
    |> then(&ApiErrors.respond(conn, &1))
  end

  def credits(conn, _params) do
    conn
    |> current_human()
    |> AgentPlatform.credit_summary()
    |> then(&ApiErrors.respond(conn, &1))
  end

  def checkout_credits(conn, params) do
    conn
    |> current_human()
    |> AgentPlatform.checkout_credits(params)
    |> then(&ApiErrors.respond(conn, &1))
  end

  def feed(conn, %{"slug" => slug}) do
    ApiErrors.respond(conn, AgentPlatform.feed_payload(slug))
  end

  defp current_human(conn) do
    conn
    |> get_session(:current_human_id)
    |> Accounts.get_human()
  end
end
