defmodule PlatformPhxWeb.DashboardLive do
  use PlatformPhxWeb, :live_view

  alias PlatformPhx.RuntimeConfig

  @impl true
  @spec mount(map(), map(), Phoenix.LiveView.Socket.t()) ::
          {:ok, Phoenix.LiveView.Socket.t()}
  def mount(_params, _session, socket) do
    {:ok,
     socket
     |> assign(:page_title, "Services")
     |> assign(
       :dashboard_config,
       Jason.encode!(%{
         privyAppId: RuntimeConfig.privy_app_id(),
         privyClientId: RuntimeConfig.privy_client_id(),
         baseRpcUrl: RuntimeConfig.base_rpc_url(),
         redeemerAddress: RuntimeConfig.redeemer_address(),
         endpoints: %{
           basenamesConfig: "/api/basenames/config",
           basenamesAllowance: "/api/basenames/allowance",
           basenamesAvailability: "/api/basenames/availability",
           basenamesOwned: "/api/basenames/owned",
           basenamesRecent: "/api/basenames/recent",
           basenamesMint: "/api/basenames/mint",
           autolaunchAuctions: "/api/agentlaunch/auctions",
           opensea: "/api/opensea"
         }
       })
     )}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app
      flash={@flash}
      current_scope={assigns[:current_scope]}
      chrome={:app}
      active_nav="services"
      theme_class="rg-regent-theme-platform"
    >
      <div
        id="platform-dashboard-shell"
        class="pp-dashboard-shell rg-regent-theme-platform"
        phx-hook="DashboardReveal"
      >
        <section data-dashboard-block>
          <div
            id="dashboard-root"
            phx-hook="DashboardRoot"
            phx-update="ignore"
            data-dashboard-config={@dashboard_config}
          >
          </div>
        </section>
      </div>
    </Layouts.app>
    """
  end
end
