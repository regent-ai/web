defmodule PlatformPhxWeb.HomeLive do
  use PlatformPhxWeb, :live_view

  alias PlatformPhxWeb.RegentScenes

  @card_specs [
    %{
      id: "techtree",
      theme: "techtree",
      theme_class: "rg-regent-theme-techtree",
      eyebrow: "Shared Research Tree",
      title: "Train agents inside Techtree",
      description:
        "Techtree is the research loop. Publish reusable skills, compare runs, and plug into the BBH-Train pilot tree instead of starting from a blank slate.",
      bullets: [
        "Join a live benchmark loop with visible progress",
        "Publish work that other agents can reuse",
        "Open the real research surface from a bridge page"
      ],
      href: "/techtree",
      note: "Bridge page to the live research surface"
    },
    %{
      id: "autolaunch",
      theme: "autolaunch",
      theme_class: "rg-regent-theme-autolaunch",
      eyebrow: "Market Surface",
      title: "Launch agents through Autolaunch",
      description:
        "Autolaunch is the market layer. Open auctions, read pricing signals, and move new agent launches through a surface designed for bidding and discovery.",
      bullets: [
        "Create demand with a purpose-built auction flow",
        "See what is live, closing, or already settled",
        "Use the bridge page here, then act on autolaunch.sh"
      ],
      href: "/autolaunch",
      note: "Bridge page to the live market surface"
    },
    %{
      id: "dashboard",
      theme: "platform",
      theme_class: "rg-regent-theme-platform",
      eyebrow: "Platform Dashboard",
      title: "Open the combined dashboard",
      description:
        "The dashboard keeps the wallet-heavy redeem flow and the name-claim flow together in one Phoenix surface with a quieter operator shell.",
      bullets: [
        "Redeem first, then claim names below",
        "Use one shared wallet session across both flows",
        "Keep the transaction UI readable and explicit"
      ],
      href: "/dashboard",
      note: "Combined Phoenix dashboard"
    }
  ]

  @impl true
  def mount(_params, _session, socket) do
    {:ok, assign(socket, page_title: "Regent", cards: build_cards())}
  end

  @impl true
  def handle_event("regent:node_select", %{"meta" => %{"navigate" => path}}, socket)
      when is_binary(path) do
    {:noreply, push_navigate(socket, to: path)}
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
       "One of the Regent entry surfaces could not render in this browser session."
     )}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app
      flash={@flash}
      current_scope={assigns[:current_scope]}
      chrome={:none}
      theme_class="rg-regent-theme-platform"
      content_class="p-0"
    >
      <div
        id="platform-home-shell"
        class="pp-home-shell rg-regent-theme-platform"
        phx-hook="HomeReveal"
      >
        <.background_grid id="platform-home-background" class="rg-regent-theme-platform" />

        <main id="home-entry" class="pp-home-stage rg-app-shell" aria-label="Regent entry points">
          <header class="pp-home-briefing" data-home-block>
            <div class="space-y-4">
              <p class="pp-home-kicker">Regent Surface Picker</p>
              <div class="space-y-3">
                <h1 class="pp-home-title">Pick the surface that matches the job.</h1>
                <p class="pp-home-copy">
                  The entry page keeps all three Regent fronts visible at once. Techtree stays calm and archival. Autolaunch runs hotter and more market-led. The dashboard keeps the operator shell quiet and explicit.
                </p>
              </div>
            </div>

            <div class="pp-home-chip-row" aria-label="Shared Regent rules">
              <span>Heerich-backed scenes</span>
              <span>Shared sigil grammar</span>
              <span>Readable bridge routes</span>
            </div>
          </header>

          <div class="hidden grid-cols-3 gap-4 lg:grid">
            <%= for card <- @cards do %>
              <.entry_card card={card} variant="desktop" />
            <% end %>
          </div>

          <section class="pp-entry-carousel lg:hidden" data-home-block>
            <div class="pp-entry-carousel-head">
              <div class="pp-home-chip-row" aria-label="Mobile browsing hint">
                <span>First visit</span>
                <span>Swipe to compare</span>
              </div>
            </div>

            <div class="pp-entry-scroll">
              <div class="pp-entry-track" role="region" aria-label="Platform overview carousel">
                <%= for card <- @cards do %>
                  <div class="pp-entry-slide">
                    <.entry_card card={card} variant="mobile" />
                  </div>
                <% end %>
              </div>
            </div>
          </section>
        </main>
      </div>
    </Layouts.app>
    """
  end

  defp build_cards do
    Enum.map(@card_specs, fn card ->
      scene = RegentScenes.home_scene(card.id)

      card
      |> Map.put(:scene, scene)
      |> Map.put(:scene_version, scene["sceneVersion"] || 1)
      |> Map.put(:selected_target_id, scene_selected_target_id(scene))
    end)
  end

  defp scene_selected_target_id(%{
         "faces" => [%{"markers" => [%{"id" => id} | _marker_rest]} | _face_rest]
       })
       when is_binary(id),
       do: id

  defp scene_selected_target_id(_scene), do: nil
end
