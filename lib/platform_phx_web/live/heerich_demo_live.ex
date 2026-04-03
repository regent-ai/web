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
     |> assign(:feature_rows, HeerichDemoScenes.feature_rows())
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
        <main id="platform-heerich-demo" class="pp-demo-stage" aria-label="Heerich hover cycle demos">
          <section class="pp-demo-hero" data-demo-block>
            <div class="space-y-4">
              <p class="pp-home-kicker">Heerich 0.7.1 Lab</p>
              <div class="space-y-3">
                <h1 class="pp-home-title">
                  Shared Regent surfaces, raw Heerich commands, and direct procedural scenes.
                </h1>
                <p class="pp-home-copy">
                  This page now covers the full Heerich 0.7.1 path inside the `/web` app: shared Regent surfaces driven by raw commands, carved wall styling, voxel scaling, restyling, and a direct JS-only gallery for procedural shapes that do not belong in Phoenix scene JSON.
                </p>
              </div>
            </div>

            <div class="pp-home-chip-row" aria-label="Demo rules">
              <span>Real Regent scenes</span>
              <span>HoverCycle on scaled geometry</span>
              <span>Carve and restyle primitives</span>
              <span>Direct JS procedural gallery</span>
            </div>
          </section>

          <section class="pp-demo-grid" data-demo-block aria-label="Heerich demo cards">
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

              <div class="pp-table-scroll">
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
              </div>
            </article>

            <article class="pp-demo-panel">
              <div class="space-y-3">
                <p class="pp-home-kicker">Heerich 0.7.1 additions</p>
                <h2 class="pp-route-panel-title">What the raw command path unlocks</h2>
                <p class="pp-panel-copy">
                  These are the new features this upgrade is using directly, either in the shipped Regent scenes or in the demos on this page.
                </p>
              </div>

              <div class="pp-table-scroll">
                <table class="rg-table pp-demo-atlas-table">
                  <thead>
                    <tr>
                      <th scope="col">Feature</th>
                      <th scope="col">What it changes</th>
                      <th scope="col">Where it shows up</th>
                    </tr>
                  </thead>
                  <tbody>
                    <%= for {label, meaning, example} <- @feature_rows do %>
                      <tr>
                        <th scope="row">{label}</th>
                        <td>{meaning}</td>
                        <td>{example}</td>
                      </tr>
                    <% end %>
                  </tbody>
                </table>
              </div>
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

          <section class="pp-demo-panel" data-demo-block>
            <div class="space-y-3">
              <p class="pp-home-kicker">Direct JS ownership</p>
              <h2 class="pp-route-panel-title">
                Procedural shapes that stay outside Phoenix scene JSON
              </h2>
              <p class="pp-panel-copy">
                These three examples are rendered directly in the browser with the real Heerich runtime. They use `applyGeometry(type: "fill")`, functional style, and functional scale, which stay on the JS side by design instead of crossing the LiveView boundary.
              </p>
            </div>

            <div class="pp-procedural-grid">
              <article class="pp-procedural-card">
                <div class="space-y-2">
                  <p class="pp-home-kicker">applyGeometry(type: "fill")</p>
                  <h3 class="pp-route-panel-title">Procedural torus shell</h3>
                  <p class="pp-panel-copy">
                    A shape defined entirely by a test function over `(x, y, z)`, not by boxes or spheres.
                  </p>
                </div>
                <div
                  id="platform-procedural-demo-fill"
                  class="pp-procedural-canvas"
                  phx-hook="HeerichProceduralDemo"
                  data-demo-kind="fill"
                >
                </div>
              </article>

              <article class="pp-procedural-card">
                <div class="space-y-2">
                  <p class="pp-home-kicker">Functional style</p>
                  <h3 class="pp-route-panel-title">Spectral block</h3>
                  <p class="pp-panel-copy">
                    The color is computed per voxel from position, so the shape gets its palette from geometry instead of a single flat fill.
                  </p>
                </div>
                <div
                  id="platform-procedural-demo-style"
                  class="pp-procedural-canvas"
                  phx-hook="HeerichProceduralDemo"
                  data-demo-kind="style"
                >
                </div>
              </article>

              <article class="pp-procedural-card">
                <div class="space-y-2">
                  <p class="pp-home-kicker">Functional scale</p>
                  <h3 class="pp-route-panel-title">Tapered tower</h3>
                  <p class="pp-panel-copy">
                    The mass decays by height, which gives you staircase and taper behaviors without manually authoring every cell.
                  </p>
                </div>
                <div
                  id="platform-procedural-demo-scale"
                  class="pp-procedural-canvas"
                  phx-hook="HeerichProceduralDemo"
                  data-demo-kind="scale"
                >
                </div>
              </article>
            </div>
          </section>
        </main>
      </div>
    </Layouts.app>
    """
  end
end
