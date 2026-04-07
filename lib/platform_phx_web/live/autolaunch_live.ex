defmodule PlatformPhxWeb.AutolaunchLive do
  use PlatformPhxWeb, :live_view

  alias PlatformPhx.AgentLaunch
  alias PlatformPhxWeb.RegentScenes

  @default_focus "launch"

  @impl true
  @spec mount(map(), map(), Phoenix.LiveView.Socket.t()) ::
          {:ok, Phoenix.LiveView.Socket.t()}
  def mount(_params, _session, socket) do
    auctions = AgentLaunch.list_auctions()
    split = AgentLaunch.split_auctions(auctions)
    current_count = length(split.current)
    past_count = length(split.past)

    {:ok,
     socket
     |> assign(:page_title, "Autolaunch")
     |> assign(:bridge_focus, @default_focus)
     |> assign(:current_auctions, split.current)
     |> assign(:past_auctions, split.past)
     |> assign(:current_count, current_count)
     |> assign(:past_count, past_count)
     |> assign_regent_scene()}
  end

  @impl true
  @spec handle_event(String.t(), map(), Phoenix.LiveView.Socket.t()) ::
          {:noreply, Phoenix.LiveView.Socket.t()}
  def handle_event("regent:node_select", %{"meta" => %{"focus" => focus}}, socket) do
    {:noreply,
     socket
     |> assign(:bridge_focus, RegentScenes.autolaunch_focus(focus))
     |> assign_regent_scene()}
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
       "The Autolaunch bridge surface could not render in this browser session."
     )}
  end

  @impl true
  def render(assigns) do
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
        <div class="pp-route-stage">
          <section class="pp-route-grid" data-bridge-block>
            <article class="pp-route-panel pp-product-panel pp-product-panel--feature">
              <p class="pp-home-kicker">Purpose</p>
              <h2 class="pp-route-panel-title">
                Autolaunch helps agents raise capital before they scale.
              </h2>
              <p class="pp-panel-copy">
                It covers the launch path from prelaunch planning through Uniswap CCA auctions, bid and position tracking,
                claims, exits, revsplit accounting, and post-launch operator work.
              </p>
              <p class="pp-panel-copy">
                Autolaunch lets an agent with a real edge preseed revenue, fund API and server costs, and start the climb.
              </p>
              <p class="pp-panel-copy">
                Each launch runs through a fair CCA auction on Ethereum mainnet and pairs with a revsplit contract that
                tracks revenue sharing for the token.
              </p>
              <p class="pp-panel-copy">
                Autolaunch requires ERC-8004 registration before launch and supports optional ENS and World rails for
                stronger trust around the agent behind the token.
              </p>
            </article>

            <article class="pp-route-panel pp-product-panel">
              <p class="pp-home-kicker">Tech stack</p>
              <h2 class="pp-route-panel-title">
                Linked tools, runtimes, agent surfaces, and platforms behind Autolaunch.
              </h2>
              <div class="pp-product-stack-grid">
                <%= for section <- autolaunch_stack_sections() do %>
                  <section class="pp-product-stack-card">
                    <p class="pp-home-kicker">{section.title}</p>
                    <ul class="pp-product-link-list">
                      <%= for item <- section.items do %>
                        <li>
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            class="pp-preview-link-list"
                          >
                            {item.label}
                          </a>
                        </li>
                      <% end %>
                    </ul>
                  </section>
                <% end %>
              </div>
            </article>
          </section>

          <section class="pp-route-grid" data-bridge-block>
            <article class="pp-route-panel pp-product-panel">
              <p class="pp-home-kicker">Agent Skill</p>
              <h2 class="pp-route-panel-title">
                For your Openclaw or Hermes agent:
              </h2>
              <blockquote class="pp-route-quote">
                [Autolaunch skill.md coming soon]
              </blockquote>
            </article>

            <article class="pp-route-panel pp-product-panel">
              <p class="pp-home-kicker">Preview</p>
              <h2 class="pp-route-panel-title">
                Open the live Autolaunch surface, or inspect the repo that runs it.
              </h2>
              <p class="pp-panel-copy">
                Autolaunch is live at autolaunch.sh. The repo remains the active place to inspect the Phoenix
                app, local Foundry workspace, and the trust and lifecycle logic behind the market surface.
              </p>
              <div class="pp-link-row">
                <.preview_link variant="pill" href="https://autolaunch.sh">
                  Open autolaunch.sh <span aria-hidden="true">↗</span>
                </.preview_link>
                <a
                  href="https://github.com/regent-ai/autolaunch"
                  target="_blank"
                  rel="noreferrer"
                  class="pp-link-button pp-link-button-ghost pp-link-button-slim"
                >
                  Browse GitHub repo <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          </section>

          <section class="pp-route-grid" data-bridge-block>
            <article class="pp-route-panel pp-product-panel pp-route-panel-span">
              <p class="pp-home-kicker">CLI rails</p>
              <h2 class="pp-route-panel-title">
                Real Regent commands for launch planning, auctions, and operator follow-up.
              </h2>
              <div class="pp-product-cli-grid pp-product-cli-grid--two-up">
                <%= for command <- autolaunch_cli_examples() do %>
                  <section class="pp-product-cli-card">
                    <code class="pp-product-cli-command">{command.command}</code>
                    <p class="pp-panel-copy">{command.description}</p>
                  </section>
                <% end %>
              </div>
            </article>
          </section>
        </div>
      </div>
    </Layouts.app>
    """
  end

  defp assign_regent_scene(socket) do
    focus = RegentScenes.autolaunch_focus(socket.assigns[:bridge_focus] || @default_focus)
    next_version = (socket.assigns[:regent_scene_version] || 0) + 1
    current_count = socket.assigns.current_count
    past_count = socket.assigns.past_count

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

  defp autolaunch_stack_sections do
    [
      %{
        title: "Agent stack",
        items: [
          %{label: "Openclaw", href: "https://openclaw.sh"},
          %{label: "Hermes", href: "https://hermes.ac"},
          %{label: "ENSIP-25", href: "https://ens.domains/blog/post/ensip-25"},
          %{label: "ERC-8004", href: "https://8004scan.io/"},
          %{label: "x402", href: "https://www.x402.org/"},
          %{label: "MPP", href: "https://stripe.com/blog/machine-payments-protocol"}
        ]
      },
      %{
        title: "Backend",
        items: [
          %{label: "Elixir", href: "https://elixir-lang.org"},
          %{label: "Ecto", href: "https://hexdocs.pm/ecto/Ecto.html"},
          %{label: "Dragonfly", href: "https://www.dragonflydb.io/"},
          %{label: "Privy", href: "https://privy.io"},
          %{label: "IPFS", href: "https://ipfs.io"},
          %{label: "Ethereum", href: "https://ethereum.org"},
          %{label: "Base", href: "https://base.org"}
        ]
      },
      %{
        title: "Frontend",
        items: [
          %{label: "Phoenix Framework", href: "https://www.phoenixframework.org"},
          %{label: "Phoenix LiveView", href: "https://hexdocs.pm/phoenix_live_view/welcome.html"},
          %{label: "TypeScript", href: "https://www.typescriptlang.org"},
          %{label: "Heerich", href: "https://www.npmjs.com/package/heerich"},
          %{label: "IDKit", href: "https://docs.world.org/world-id/id/web-react"}
        ]
      }
    ]
  end

  defp autolaunch_cli_examples do
    [
      %{
        command: "regent autolaunch prelaunch wizard",
        description: "Builds the launch plan before anything is published onchain."
      },
      %{
        command: "regent autolaunch prelaunch publish",
        description: "Publishes the prepared launch metadata and assets."
      },
      %{
        command: "regent autolaunch launch run",
        description: "Starts the real launch execution path from the saved plan."
      },
      %{
        command: "regent autolaunch launch monitor",
        description: "Tracks lifecycle state while the launch is in motion."
      },
      %{
        command: "regent autolaunch launch finalize",
        description: "Handles the post-auction finalize and settlement follow-up."
      },
      %{
        command: "regent autolaunch auctions list",
        description: "Lists the planned and recent market surface."
      },
      %{
        command: "regent autolaunch bids quote",
        description: "Computes bid terms before funds are committed."
      },
      %{
        command: "regent autolaunch bids place",
        description: "Places an auction bid through the operator rail once access opens."
      },
      %{
        command: "regent autolaunch positions list",
        description: "Shows the positions an operator can later claim, exit, or track."
      },
      %{
        command: "regent autolaunch trust x-link --agent <id>",
        description: "Runs the X trust follow-up helper for one agent identity."
      }
    ]
  end
end
