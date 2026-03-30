defmodule PlatformPhx.Repo do
  use Ecto.Repo,
    otp_app: :platform_phx,
    adapter: Ecto.Adapters.Postgres
end
