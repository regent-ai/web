defmodule PlatformPhxWeb.AutolaunchLive do
  use PlatformPhxWeb, :live_view

  alias PlatformPhx.AgentLaunch
  alias PlatformPhxWeb.RegentScenes

  @default_focus "launch"

  @impl true
  def mount(_params, _session, socket) do
    payload = AgentLaunch.generated_payload()
    split = AgentLaunch.split_auctions(AgentLaunch.list_auctions())

    {:ok,
     socket
     |> assign(:page_title, "Autolaunch")
     |> assign(:bridge_focus, @default_focus)
     |> assign(:auctions_payload, payload)
     |> assign(:current_auctions, split.current)
     |> assign(:past_auctions, split.past)
     |> assign_regent_scene()}
  end

  @impl true
  def handle_event("regent:node_select", %{"meta" => %{"focus" => focus}}, socket) do
    {:noreply,
     socket
     |> assign(:bridge_focus, RegentScenes.autolaunch_focus(focus))
     |> assign_regent_scene()}
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
       "The Autolaunch bridge surface could not render in this browser session."
     )}
  end

  @impl true
  def render(assigns) do
    current_count = length(assigns.current_auctions)
    past_count = length(assigns.past_auctions)

    assigns =
      assigns
      |> assign(:current_count, current_count)
      |> assign(:past_count, past_count)

    ~H"""
    <Layouts.app
      flash={@flash}
      current_scope={assigns[:current_scope]}
      chrome={:app}
      active_nav="autolaunch"
      theme_class="rg-regent-theme-platform"
    >
      <div
        id="platform-autolaunch-shell"
        class="pp-route-shell rg-regent-theme-autolaunch"
        phx-hook="AutolaunchReveal"
      >
        <.background_grid id="platform-autolaunch-background" class="rg-regent-theme-autolaunch" />

        <div class="pp-route-stage">
          <section id="platform-autolaunch-bridge" class="pp-route-surface-wrap" data-bridge-block>
            <.surface
              id="platform-autolaunch-surface"
              class="pp-route-surface rg-regent-theme-autolaunch"
              scene={@regent_scene}
              scene_version={@regent_scene_version}
              selected_target_id={@regent_selected_target_id}
              theme="autolaunch"
              camera_distance={25}
            >
              <:chamber>
                <.chamber
                  id="platform-autolaunch-chamber"
                  title={@bridge_content.title}
                  subtitle={@bridge_content.subtitle}
                  summary={@bridge_content.summary}
                >
                  <div class="pp-tag-row" aria-label="Autolaunch bridge tags">
                    <%= for tag <- @bridge_content.tags do %>
                      <span class="pp-tag">{tag}</span>
                    <% end %>
                  </div>

                  <div class="pp-link-row">
                    <a
                      href="https://autolaunch.sh"
                      target="_blank"
                      rel="noreferrer"
                      class="pp-link-button"
                    >
                      Open autolaunch.sh <span aria-hidden="true">↗</span>
                    </a>
                    <a
                      href="https://autolaunch.sh/auctions"
                      target="_blank"
                      rel="noreferrer"
                      class="pp-link-button pp-link-button-ghost"
                    >
                      Browse live market <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </.chamber>
              </:chamber>

              <:ledger>
                <.ledger
                  id="platform-autolaunch-ledger"
                  title="Market split"
                  subtitle="The bridge keeps the current and past board explicit while the live market stays external."
                >
                  <table class="rg-table">
                    <tbody>
                      <%= for {label, value} <- @bridge_content.table do %>
                        <tr>
                          <th scope="row">{label}</th>
                          <td>{value}</td>
                        </tr>
                      <% end %>
                    </tbody>
                  </table>
                </.ledger>
              </:ledger>
            </.surface>
          </section>

          <section data-bridge-block>
            <.cli_bootstrap
              title="Start local, then load the market skill"
              summary="Bring up a fresh Regent shell locally, then pull the Autolaunch skill before you leave the bridge page for the live auction surface."
              skill_label="2. Load Autolaunch skill"
              skill_command="curl -fsSL https://autolaunch.sh/skill.md"
              skill_note="Use the Autolaunch skill when you want the hotter launch, auction, and settlement workflow rather than the calmer platform shell."
            />
          </section>

          <section class="pp-route-grid" data-bridge-block>
            <article class="pp-route-panel">
              <p class="pp-home-kicker">Current board</p>
              <h2 class="pp-route-panel-title">{@current_count} live or still settling</h2>
              <p class="pp-panel-copy">
                Use this page to stay oriented, then move out to the real market surface when you need to bid, claim, or inspect the full auction state.
              </p>
            </article>

            <article class="pp-route-panel">
              <p class="pp-home-kicker">Latest snapshot</p>
              <h2 class="pp-route-panel-title">
                {Calendar.strftime(@auctions_payload.generated_at, "%b %-d, %-I:%M %p")}
              </h2>
              <p class="pp-panel-copy">
                Past board count: {@past_count}. The split is kept visible here so the bridge page stays operator-readable instead of turning into a decorative mirror.
              </p>
            </article>
          </section>

          <section class="pp-auction-columns" data-bridge-block>
            <.auction_column
              id="platform-current-auctions"
              title="Current Auctions"
              description="Open or still settling. Jump out to the market when you are ready to act."
              empty_label="No live or pending auctions right now."
              items={@current_auctions}
            />

            <.auction_column
              id="platform-past-auctions"
              title="Past Auctions"
              description="Closed or already moved. Kept here as a quick tape of recent market motion."
              empty_label="No past auctions are available yet."
              items={@past_auctions}
            />
          </section>
        </div>
      </div>
    </Layouts.app>
    """
  end

  defp auction_column(assigns) do
    ~H"""
    <section id={@id} class="pp-route-panel">
      <div class="space-y-2">
        <p class="pp-home-kicker">{@title}</p>
        <h2 class="pp-route-panel-title">{length(@items)} entries</h2>
        <p class="pp-panel-copy">{@description}</p>
      </div>

      <%= if Enum.empty?(@items) do %>
        <p class="pp-panel-copy mt-4">{@empty_label}</p>
      <% else %>
        <div class="pp-auction-list">
          <%= for auction <- @items do %>
            <article id={"platform-auction-#{auction.id}"} class="pp-auction-row">
              <div class="space-y-1">
                <h3>{auction.agent_name}</h3>
                <p>{auction.agent_id} on {auction.network}</p>
              </div>

              <div class="pp-auction-meta">
                <span>{status_label(auction.status)}</span>
                <span>{auction.raised_currency}</span>
                <span>{Integer.to_string(auction.bidders)} bidders</span>
              </div>
            </article>
          <% end %>
        </div>
      <% end %>
    </section>
    """
  end

  defp assign_regent_scene(socket) do
    focus = RegentScenes.autolaunch_focus(socket.assigns[:bridge_focus] || @default_focus)
    next_version = (socket.assigns[:regent_scene_version] || 0) + 1
    current_count = length(socket.assigns.current_auctions)
    past_count = length(socket.assigns.past_auctions)

    socket
    |> assign(:bridge_focus, focus)
    |> assign(:bridge_content, RegentScenes.autolaunch_content(focus, current_count, past_count))
    |> assign(:regent_selected_target_id, "autolaunch:#{focus}")
    |> assign(:regent_scene_version, next_version)
    |> assign(
      :regent_scene,
      RegentScenes.autolaunch_bridge(current_count, past_count, focus, next_version)
    )
  end

  defp status_label("active"), do: "Active"
  defp status_label("ending-soon"), do: "Ending soon"
  defp status_label("pending-claim"), do: "Pending claim"
  defp status_label("settled"), do: "Settled"
  defp status_label(other), do: other
end
