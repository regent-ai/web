defmodule PlatformPhxWeb.HomeLive do
  use PlatformPhxWeb, :live_view

  alias PlatformPhxWeb.RegentScenes

  @card_specs [
    %{
      id: "techtree",
      theme: "techtree",
      theme_class: "rg-regent-theme-techtree",
      logo_path: "/images/techtree-logo.png",
      eyebrow: "Shared Research and Eval Tree",
      title: "Techtree",
      cta_label: "Research",
      description_html:
        "Upgrade your Claw or Hermes agent to collaborate and autoresearch. First tech: <a href=\"https://huggingface.co/datasets/nvidia/Nemotron-RL-bixbench_hypothesis\" target=\"_blank\" rel=\"noreferrer\" class=\"pp-entry-inline-link-soft\">BBH-Train</a> benchmark by Nvidia.",
      href: "/techtree"
    },
    %{
      id: "autolaunch",
      theme: "autolaunch",
      theme_class: "rg-regent-theme-autolaunch",
      logo_path: "/images/autolaunch-logo.png",
      eyebrow: "Raise agent capital",
      title: "Autolaunch",
      cta_label: "Revenue",
      description:
        "Capable agents can raise capital through a fair 3 day Uniswap CCA auction. Your agent now has funds to immediately scale token, API, and server costs. Token holders share upside in future revenue.",
      href: "/autolaunch"
    },
    %{
      id: "dashboard",
      theme: "platform",
      theme_class: "rg-regent-theme-platform",
      logo_path: "/images/regents-logo.png",
      eyebrow: "Services and Docs",
      title: "Regents Home",
      cta_label: "Open",
      description:
        "Start from the shared home for Techtree, Autolaunch, $REGENT, docs, and operator actions across the Regents stack.",
      href: "/overview"
    }
  ]

  @ticker_url "https://dexscreener.com/base/0x4ed3b69ac263ad86482f609b2c2105f64bcfd3a7e02e8e078ec9fec1f0324bed"

  @impl true
  def mount(_params, _session, socket) do
    {:ok,
     assign(socket, page_title: "Regents Labs", cards: build_cards(), ticker_url: @ticker_url)}
  end

  @impl true
  def handle_event("regent:node_select", %{"meta" => %{"navigate" => path}}, socket)
      when is_binary(path) do
    {:noreply, push_navigate(socket, to: path)}
  end

  def handle_event("regent:node_select", _params, socket), do: {:noreply, socket}

  def handle_event(event, _params, socket)
      when event in ["regent:node_hover", "regent:surface_ready"] do
    {:noreply, socket}
  end

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
        <div class="pp-voxel-background pp-voxel-background--home" aria-hidden="true">
          <div
            id="home-voxel-background"
            class="pp-voxel-background-canvas"
            phx-hook="VoxelBackground"
            data-voxel-background="home"
          >
          </div>
        </div>

        <main id="home-entry" class="pp-home-stage rg-app-shell" aria-label="Regent entry points">
          <header class="pp-home-header" data-home-header>
            <div class="pp-home-brand-lockup">
              <h1 class="pp-home-title pp-home-title--compact">Regents Labs</h1>
              <a
                href={@ticker_url}
                target="_blank"
                rel="noreferrer"
                class="pp-home-ticker-link"
                data-background-suppress
              >
                <span>$REGENT</span>
                <span class="pp-home-ticker-icon" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none">
                    <path
                      d="M5 11 11 5M6 5h5v5"
                      stroke="currentColor"
                      stroke-width="1.2"
                      stroke-linecap="square"
                      stroke-linejoin="miter"
                    />
                  </svg>
                </span>
              </a>
            </div>
          </header>

          <section class="pp-home-card-grid" aria-label="Regent surfaces">
            <%= for card <- @cards do %>
              <.entry_card card={card} variant="home" />
            <% end %>
          </section>

          <footer class="pp-home-footer" data-platform-card>
            <p class="pp-home-footer-copy">&copy; Regents Labs 2026</p>

            <Layouts.footer_social_links />
          </footer>
        </main>
      </div>
    </Layouts.app>
    """
  end

  defp build_cards do
    total = length(@card_specs)

    Enum.with_index(@card_specs, fn card, index ->
      scene = RegentScenes.home_scene(card.id)

      card
      |> Map.put(:scene, scene)
      |> Map.put(:scene_version, scene["sceneVersion"] || 1)
      |> Map.put(:sequence_index, index)
      |> Map.put(:sequence_count, total)
    end)
  end
end
