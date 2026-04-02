defmodule PlatformPhxWeb.Api.OpenseaController do
  use PlatformPhxWeb, :controller

  alias PlatformPhx.OpenSea
  alias PlatformPhxWeb.ApiErrors

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, %{"address" => address} = params) do
    collection =
      case params["collection"] do
        nil -> :all
        value -> value
      end

    ApiErrors.respond(conn, OpenSea.fetch_holdings(address, collection))
  end

  def index(conn, _params) do
    ApiErrors.error(conn, {:bad_request, "Invalid query params"})
  end
end
