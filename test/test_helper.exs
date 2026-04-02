ExUnit.start()
Ecto.Adapters.SQL.Sandbox.mode(PlatformPhx.Repo, :manual)
Application.put_env(:platform_phx, :ethereum_adapter, PlatformPhx.TestEthereumAdapter)
