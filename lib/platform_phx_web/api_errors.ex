defmodule PlatformPhxWeb.ApiErrors do
  @moduledoc false

  use PlatformPhxWeb, :controller

  @type reason ::
          {:bad_request, String.t()}
          | {:not_found, String.t()}
          | {:forbidden, String.t()}
          | {:unauthorized, String.t()}
          | {:conflict, String.t()}
          | {:payment_required, String.t()}
          | {:unavailable, String.t()}
          | {:external, atom(), String.t()}

  @spec respond(Plug.Conn.t(), {:ok, map()} | {:error, reason()}) :: Plug.Conn.t()
  def respond(conn, {:ok, payload}), do: json(conn, payload)
  def respond(conn, {:error, reason}), do: error(conn, reason)

  @spec error(Plug.Conn.t(), reason()) :: Plug.Conn.t()
  def error(conn, {:bad_request, message}), do: render_status(conn, :bad_request, message)
  def error(conn, {:not_found, message}), do: render_status(conn, :not_found, message)
  def error(conn, {:forbidden, message}), do: render_status(conn, :forbidden, message)
  def error(conn, {:unauthorized, message}), do: render_status(conn, :unauthorized, message)
  def error(conn, {:conflict, message}), do: render_status(conn, :conflict, message)
  def error(conn, {:payment_required, message}), do: render_status(conn, 402, message)
  def error(conn, {:unavailable, message}), do: render_status(conn, :service_unavailable, message)
  def error(conn, {:external, _source, message}), do: render_status(conn, :bad_gateway, message)

  @spec render_status(Plug.Conn.t(), Plug.Conn.status() | atom(), String.t()) :: Plug.Conn.t()
  def render_status(conn, status, message) do
    conn
    |> put_status(status)
    |> json(%{"statusMessage" => message})
  end
end
