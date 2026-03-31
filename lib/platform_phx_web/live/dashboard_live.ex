defmodule PlatformPhxWeb.DashboardLive do
  use PlatformPhxWeb, :live_view

  alias PlatformPhx.RuntimeConfig
  alias PlatformPhxWeb.RegentScenes

  @default_focus "session"

  @impl true
  def mount(_params, _session, socket) do
    {:ok,
     socket
     |> assign(:page_title, "Dashboard")
     |> assign(:bridge_focus, @default_focus)
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
     )
     |> assign_regent_scene()}
  end

  @impl true
  def handle_event("regent:node_select", %{"meta" => %{"focus" => focus}}, socket) do
    {:noreply,
     socket |> assign(:bridge_focus, RegentScenes.dashboard_focus(focus)) |> assign_regent_scene()}
  end

  def handle_event("regent:node_select", _params, socket), do: {:noreply, socket}
  def handle_event("regent:node_hover", _params, socket), do: {:noreply, socket}
  def handle_event("regent:surface_ready", _params, socket), do: {:noreply, socket}

  @impl true
  def handle_event("regent:surface_error", _params, socket) do
    {:noreply,
     put_flash(
       socket,
       :error,
       "The dashboard header surface could not render in this browser session."
     )}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app
      flash={@flash}
      current_scope={assigns[:current_scope]}
      chrome={:app}
      active_nav="dashboard"
      theme_class="rg-regent-theme-platform"
    >
      <div
        id="platform-dashboard-shell"
        class="pp-dashboard-shell rg-regent-theme-platform"
        phx-hook="DashboardReveal"
      >
        <section id="platform-dashboard-hero" class="pp-dashboard-hero" data-dashboard-block>
          <div class="pp-dashboard-copy">
            <p class="pp-home-kicker">Ops citadel</p>
            <h2 class="pp-home-title">{@dashboard_content.title}</h2>
            <p class="pp-home-copy">{@dashboard_content.summary}</p>

            <div class="pp-home-chip-row" aria-label="Dashboard summary">
              <%= for tag <- @dashboard_content.tags do %>
                <span>{tag}</span>
              <% end %>
            </div>

            <table class="rg-table">
              <tbody>
                <%= for {label, value} <- @dashboard_content.table do %>
                  <tr>
                    <th scope="row">{label}</th>
                    <td>{value}</td>
                  </tr>
                <% end %>
              </tbody>
            </table>
          </div>

          <.surface
            id="platform-dashboard-surface"
            class="pp-dashboard-header-surface pp-surface-single rg-regent-theme-platform"
            scene={@regent_scene}
            scene_version={@regent_scene_version}
            selected_target_id={@regent_selected_target_id}
            theme="platform"
            camera_distance={24}
          />
        </section>

        <section data-dashboard-block>
          <.cli_bootstrap
            title="Start the Regent operator shell"
            summary="Use the CLI to bootstrap a local Regent project, then load the general Regent skill before you move into redeem and identity work."
            skill_label="2. Load Regent skill"
            skill_command="curl -fsSL https://regents.sh/skill.md"
            skill_note="Pull the general Regent skill so the local shell knows the base operator workflow before you attach route-specific surfaces."
          />
        </section>

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

  defp assign_regent_scene(socket) do
    focus = RegentScenes.dashboard_focus(socket.assigns[:bridge_focus] || @default_focus)
    next_version = (socket.assigns[:regent_scene_version] || 0) + 1

    socket
    |> assign(:bridge_focus, focus)
    |> assign(:dashboard_content, RegentScenes.dashboard_content(focus))
    |> assign(:regent_selected_target_id, "platform:#{focus}")
    |> assign(:regent_scene_version, next_version)
    |> assign(:regent_scene, RegentScenes.dashboard_header(focus, next_version))
  end
end
