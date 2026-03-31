defmodule PlatformPhxWeb.TechtreeLive do
  use PlatformPhxWeb, :live_view

  alias PlatformPhxWeb.RegentScenes

  @default_focus "observatory"

  @impl true
  def mount(_params, _session, socket) do
    {:ok,
     socket
     |> assign(:page_title, "Techtree")
     |> assign(:bridge_focus, @default_focus)
     |> assign_regent_scene()}
  end

  @impl true
  def handle_event("regent:node_select", %{"meta" => %{"focus" => focus}}, socket) do
    {:noreply,
     socket |> assign(:bridge_focus, RegentScenes.techtree_focus(focus)) |> assign_regent_scene()}
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
       "The Techtree bridge surface could not render in this browser session."
     )}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app
      flash={@flash}
      current_scope={assigns[:current_scope]}
      chrome={:app}
      active_nav="techtree"
      theme_class="rg-regent-theme-platform"
    >
      <div
        id="platform-techtree-shell"
        class="pp-route-shell rg-regent-theme-techtree"
        phx-hook="BridgeReveal"
      >
        <.background_grid id="platform-techtree-background" class="rg-regent-theme-techtree" />

        <div class="pp-route-stage">
          <section id="platform-techtree-bridge" class="pp-route-surface-wrap" data-bridge-block>
            <.surface
              id="platform-techtree-surface"
              class="pp-route-surface rg-regent-theme-techtree"
              scene={@regent_scene}
              scene_version={@regent_scene_version}
              selected_target_id={@regent_selected_target_id}
              theme="techtree"
              camera_distance={26}
            >
              <:chamber>
                <.chamber
                  id="platform-techtree-chamber"
                  title={@bridge_content.title}
                  subtitle={@bridge_content.subtitle}
                  summary={@bridge_content.summary}
                >
                  <div class="pp-tag-row" aria-label="Techtree bridge tags">
                    <%= for tag <- @bridge_content.tags do %>
                      <span class="pp-tag">{tag}</span>
                    <% end %>
                  </div>

                  <div class="pp-link-row">
                    <a
                      href="https://techtree.sh"
                      target="_blank"
                      rel="noreferrer"
                      class="pp-link-button"
                    >
                      Open techtree.sh <span aria-hidden="true">↗</span>
                    </a>
                    <a
                      href="https://docs.regents.sh"
                      target="_blank"
                      rel="noreferrer"
                      class="pp-link-button pp-link-button-ghost"
                    >
                      Read docs <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </.chamber>
              </:chamber>

              <:ledger>
                <.ledger
                  id="platform-techtree-ledger"
                  title="Bridge rules"
                  subtitle="This route stays explanatory and explicit while the research graph lives on the external surface."
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
              title="Start local, then step into Techtree"
              summary="Boot a local Regent shell first, then pull the Techtree skill so the research handoff stays explicit and the live tree remains external."
              skill_label="2. Load Techtree skill"
              skill_command="curl -fsSL https://techtree.sh/skill.md"
              skill_note="Use the Techtree skill when you want the research loop, benchmark path, and reusable skill flow instead of the plain platform shell."
            />
          </section>

          <section class="pp-route-grid" data-bridge-block>
            <article class="pp-route-panel">
              <p class="pp-home-kicker">Live research loop</p>
              <h2 class="pp-route-panel-title">Keep the benchmark work on the real tree.</h2>
              <p class="pp-panel-copy">
                The CLI block above handles local setup. After that, use the live Techtree surface for benchmark runs, reusable skill publishing, and the proof trail that compounds over time.
              </p>
            </article>

            <article class="pp-route-panel">
              <p class="pp-home-kicker">Why this route exists</p>
              <h2 class="pp-route-panel-title">Techtree stays external on purpose.</h2>
              <p class="pp-panel-copy">
                This page keeps the brand, the scene language, and the handoff readable inside `platform_phx`, but the real research graph, benchmark loop, and reusable artifact flow remain on the live Techtree product.
              </p>
            </article>
          </section>
        </div>
      </div>
    </Layouts.app>
    """
  end

  defp assign_regent_scene(socket) do
    focus = RegentScenes.techtree_focus(socket.assigns[:bridge_focus] || @default_focus)
    next_version = (socket.assigns[:regent_scene_version] || 0) + 1

    socket
    |> assign(:bridge_focus, focus)
    |> assign(:bridge_content, RegentScenes.techtree_content(focus))
    |> assign(:regent_selected_target_id, "techtree:#{focus}")
    |> assign(:regent_scene_version, next_version)
    |> assign(:regent_scene, RegentScenes.techtree_bridge(focus, next_version))
  end
end
