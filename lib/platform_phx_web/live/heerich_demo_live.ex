defmodule PlatformPhxWeb.HeerichDemoLive do
  use PlatformPhxWeb, :live_view

  alias PlatformPhxWeb.HeerichDemoScenes

  @impl true
  def mount(_params, _session, socket) do
    {:ok,
     socket
     |> assign(:page_title, "Heerich Demo")
     |> assign(:demo_samples, HeerichDemoScenes.samples())
     |> assign(:knob_rows, HeerichDemoScenes.knob_rows())
     |> assign(:primer_rules, HeerichDemoScenes.primer_rules())}
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
       "One of the Heerich demo surfaces could not render in this browser session."
     )}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app
      flash={@flash}
      current_scope={assigns[:current_scope]}
      chrome={:app}
      theme_class="rg-regent-theme-platform"
    >
      <div
        id="platform-heerich-demo-shell"
        class="pp-demo-shell rg-regent-theme-platform"
        phx-hook="DemoReveal"
      >
        <.background_grid id="platform-heerich-demo-background" class="rg-regent-theme-platform" />

        <main id="platform-heerich-demo" class="pp-demo-stage" aria-label="Heerich hover cycle demos">
          <section class="pp-demo-hero" data-demo-block>
            <div class="space-y-4">
              <p class="pp-home-kicker">Heerich HoverCycle Lab</p>
              <div class="space-y-3">
                <h1 class="pp-home-title">Hover a voxel and watch it break, drift, and rebuild.</h1>
                <p class="pp-home-copy">
                  This page shows the real shared HoverCycle primitive inside `platform_phx`. Every sample below is a normal Regent surface, so what you see here is the same path Techtree, Autolaunch, and the platform shell use.
                </p>
              </div>
            </div>

            <div class="pp-home-chip-row" aria-label="Demo rules">
              <span>Real Regent scenes</span>
              <span>Grouped and single-shape hovers</span>
              <span>Marker-only and voxel-only splits</span>
              <span>Reduced motion respected</span>
            </div>
          </section>

          <section class="pp-demo-grid" data-demo-block aria-label="HoverCycle demo cards">
            <%= for sample <- @demo_samples do %>
              <.hover_cycle_demo sample={sample} />
            <% end %>
          </section>

          <section class="pp-demo-reference" data-demo-block>
            <article class="pp-demo-panel">
              <div class="space-y-3">
                <p class="pp-home-kicker">Configuration atlas</p>
                <h2 class="pp-route-panel-title">What each HoverCycle control changes</h2>
                <p class="pp-panel-copy">
                  The effect is small on purpose. These controls let you tune how dramatic, how fast, and how tightly grouped the break-and-rebuild loop should feel.
                </p>
              </div>

              <table class="rg-table pp-demo-atlas-table">
                <thead>
                  <tr>
                    <th scope="col">Control</th>
                    <th scope="col">What it changes</th>
                    <th scope="col">Seen on</th>
                  </tr>
                </thead>
                <tbody>
                  <%= for {label, meaning, example} <- @knob_rows do %>
                    <tr>
                      <th scope="row">{label}</th>
                      <td>{meaning}</td>
                      <td>{example}</td>
                    </tr>
                  <% end %>
                </tbody>
              </table>
            </article>

            <article class="pp-demo-panel">
              <div class="space-y-3">
                <p class="pp-home-kicker">Working rules</p>
                <h2 class="pp-route-panel-title">Use it as scene polish, not hidden state.</h2>
                <p class="pp-panel-copy">
                  HoverCycle should help a surface feel alive, but it should never become the only way someone understands meaning or completes a critical action.
                </p>
              </div>

              <ul class="pp-demo-rule-list">
                <%= for rule <- @primer_rules do %>
                  <li>{rule}</li>
                <% end %>
              </ul>

              <div class="pp-demo-code-grid">
                <article class="pp-demo-code-card">
                  <p class="pp-home-kicker">Turn it on</p>
                  <code class="pp-command">{"hoverCycle: true"}</code>
                </article>

                <article class="pp-demo-code-card">
                  <p class="pp-home-kicker">Group multiple shapes</p>
                  <code class="pp-command">
                    {"hoverCycle: %{\"group\" => \"launch-cluster\", \"mode\" => \"explode\"}"}
                  </code>
                </article>

                <article class="pp-demo-code-card">
                  <p class="pp-home-kicker">Turn it off explicitly</p>
                  <code class="pp-command">{"hoverCycle: %{\"enabled\" => false}"}</code>
                </article>
              </div>
            </article>
          </section>
        </main>
      </div>
    </Layouts.app>
    """
  end
end
