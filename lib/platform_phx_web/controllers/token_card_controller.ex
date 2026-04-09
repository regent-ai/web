defmodule PlatformPhxWeb.TokenCardController do
  use PlatformPhxWeb, :controller

  alias PlatformPhx.TokenCardManifest

  require Logger

  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"token_id" => token_id}) do
    Logger.info(
      "token_card_route request token_id=#{token_id} host=#{conn.host} path=#{conn.request_path}"
    )

    case TokenCardManifest.fetch(token_id) do
      {:ok, entry} ->
        Logger.info("token_card_route render token_id=#{token_id} name=#{entry["name"]}")
        render(conn, :show, page_title: entry["name"], entry_json: Jason.encode!(entry))

      {:error, reason} ->
        Logger.warning(
          "token_card_route not_found token_id=#{token_id} reason=#{inspect(reason)}"
        )

        send_resp(conn, :not_found, "Not Found")
    end
  end
end
