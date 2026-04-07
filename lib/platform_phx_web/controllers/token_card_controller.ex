defmodule PlatformPhxWeb.TokenCardController do
  use PlatformPhxWeb, :controller

  alias PlatformPhx.TokenCardManifest

  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"token_id" => token_id}) do
    case TokenCardManifest.fetch(token_id) do
      {:ok, entry} ->
        render(conn, :show, page_title: entry["name"], entry_json: Jason.encode!(entry))

      {:error, _reason} ->
        send_resp(conn, :not_found, "Not Found")
    end
  end
end
