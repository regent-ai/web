defmodule PlatformPhxWeb.Api.PrivySessionController do
  use PlatformPhxWeb, :controller

  alias PlatformPhx.Accounts
  alias PlatformPhx.AgentPlatform
  alias PlatformPhxWeb.ApiErrors

  def create(conn, %{"privyUserId" => privy_user_id} = params) do
    attrs = %{
      "wallet_address" => Map.get(params, "walletAddress"),
      "wallet_addresses" => Map.get(params, "walletAddresses", []),
      "display_name" => Map.get(params, "displayName")
    }

    with {:ok, human} <- Accounts.upsert_human_by_privy_id(privy_user_id, attrs),
         {:ok, payload} <- AgentPlatform.current_human_payload(human) do
      conn
      |> put_session(:current_human_id, human.id)
      |> json(payload)
    else
      {:error, changeset} when is_map(changeset) ->
        ApiErrors.error(conn, {:bad_request, inspect(changeset.errors)})

      {:error, _reason} = error ->
        ApiErrors.respond(conn, error)
    end
  end

  def create(conn, _params) do
    ApiErrors.error(conn, {:bad_request, "Missing privyUserId"})
  end

  def show(conn, _params) do
    conn
    |> current_human()
    |> AgentPlatform.current_human_payload()
    |> then(&ApiErrors.respond(conn, &1))
  end

  def delete(conn, _params) do
    conn
    |> configure_session(drop: true)
    |> json(%{ok: true})
  end

  defp current_human(conn) do
    conn
    |> get_session(:current_human_id)
    |> Accounts.get_human()
  end
end
