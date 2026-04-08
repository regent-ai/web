defmodule PlatformPhxWeb.LiveSessionData do
  @moduledoc false

  import Plug.Conn

  def session(conn) do
    %{
      "current_host" => conn.host,
      "current_human_id" => get_session(conn, :current_human_id)
    }
  end
end
