defmodule PlatformPhxWeb.HomeLive do
  use PlatformPhxWeb, :live_view

  alias PlatformPhx.AgentPlatform
  alias PlatformPhxWeb.AgentPlatformComponents
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
      eyebrow: "Agent Foundry",
      title: "Regents Home",
      cta_label: "Open",
      description:
        "Launch and run an agent business from the shared control plane, then open each public service page on its own subdomain.",
      href: "/services"
    }
  ]

  @ticker_url "https://dexscreener.com/base/0x4ed3b69ac263ad86482f609b2c2105f64bcfd3a7e02e8e078ec9fec1f0324bed"

  @impl true
  def mount(_params, session, socket) do
    host = session["current_host"]
    public_agent = AgentPlatform.get_agent_by_host(host)

    {:ok,
     socket
     |> assign(:page_title, if(public_agent, do: public_agent.name, else: "Regents Labs"))
     |> assign(:cards, build_cards())
     |> assign(:ticker_url, @ticker_url)
     |> assign(
       :public_agent,
       public_agent && AgentPlatform.serialize_agent(public_agent, :public)
     )
     |> assign(:subdomain_missing?, is_nil(public_agent) and subdomain_request?(host))}
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
    <%= if @public_agent do %>
      <Layouts.app
        flash={@flash}
        current_scope={assigns[:current_scope]}
        chrome={:none}
        theme_class="rg-regent-theme-platform"
        content_class="p-0"
      >
        <div
          id="agent-site-home-shell"
          class="pp-home-shell rg-regent-theme-platform"
          phx-hook="DashboardReveal"
        >
          <div class="p-4 sm:p-6 lg:p-8">
            <AgentPlatformComponents.public_agent_page agent={@public_agent} />
          </div>
        </div>
      </Layouts.app>
    <% else %>
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
            <%= if @subdomain_missing? do %>
              <section class="pp-route-panel pp-product-panel mx-auto max-w-[760px]">
                <p class="pp-home-kicker">Subdomain not active</p>
                <h1 class="pp-route-panel-title">No published agent lives on this host yet.</h1>
                <p class="pp-panel-copy">
                  Claim the name, create the agent in the foundry, and activate the subdomain before it goes live.
                </p>
                <div class="pp-link-row">
                  <.link navigate={~p"/services"} class="pp-link-button pp-link-button-slim">
                    Open Regents Foundry <span aria-hidden="true">→</span>
                  </.link>
                </div>
              </section>
            <% else %>
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
            <% end %>
          </main>
        </div>
      </Layouts.app>
    <% end %>
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

  defp subdomain_request?(host) when is_binary(host), do: String.ends_with?(host, ".regents.sh")
  defp subdomain_request?(_host), do: false
end
