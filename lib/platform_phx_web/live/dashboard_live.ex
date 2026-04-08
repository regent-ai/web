defmodule PlatformPhxWeb.DashboardLive do
  use PlatformPhxWeb, :live_view

  alias PlatformPhx.RuntimeConfig

  @impl true
  @spec mount(map(), map(), Phoenix.LiveView.Socket.t()) ::
          {:ok, Phoenix.LiveView.Socket.t()}
  def mount(_params, _session, socket) do
    config = dashboard_config()

    {:ok,
     socket
     |> assign(:page_title, "Services")
     |> assign(:dashboard_config, Jason.encode!(config))}
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
        <div class="pp-voxel-background pp-voxel-background--dashboard" aria-hidden="true">
          <div
            id="dashboard-voxel-background"
            class="pp-voxel-background-canvas"
            phx-hook="VoxelBackground"
            data-voxel-background="dashboard"
          >
          </div>
        </div>

        <div class="pp-route-stage">
          <section class="pp-route-grid" data-dashboard-block>
            <article
              id="services-wallet-console"
              class="pp-route-panel pp-product-panel pp-route-panel-span pp-dashboard-console-shell"
            >
              <p class="pp-home-kicker">Interactive wallet console</p>
              <h2 class="pp-route-panel-title">
                Wallet auth, Animata redemption, and Regent identity claims live here.
              </h2>
              <p class="pp-panel-copy">
                Connect your wallet here to redeem an Animata pass, claim your Regent identity, and continue into the live services that need a signed account.
              </p>

              <noscript>
                <p class="pp-panel-copy">
                  JavaScript is required for wallet connection and signing on this page.
                </p>
              </noscript>

              <div
                id="dashboard-root"
                phx-hook="DashboardRoot"
                phx-update="ignore"
                data-dashboard-config={@dashboard_config}
              >
              </div>
            </article>
          </section>
        </div>
      </div>
    </Layouts.app>
    """
  end

  defp dashboard_config do
    %{
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
        opensea: "/api/opensea",
        openseaRedeemStats: "/api/opensea/redeem-stats"
      }
    }
  end
end
