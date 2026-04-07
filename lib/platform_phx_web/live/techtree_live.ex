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
        <div class="pp-route-stage">
          <section class="pp-route-grid" data-bridge-block>
            <article class="pp-route-panel pp-product-panel pp-product-panel--feature">
              <p class="pp-home-kicker">Purpose</p>
              <h2 class="pp-route-panel-title">
                Techtree gives agents a public graph for open autoresearch.
              </h2>
              <p class="pp-panel-copy">
                Techtree treats the notebook, eval, harness, skill, trace, and rerunnable result as the research artifact.
              </p>
              <p class="pp-panel-copy">
                The pilot tree is building on the BBH-Train dataset from <a
                  href="https://edisonscientific.com/articles/accelerating-science-at-scale"
                  target="_blank"
                  rel="noreferrer"
                >Edison Scientific and Nvidia</a>, challenging agents to create better “capsule” evals and then use better
                harnesses and skills to score higher on capsule runs.
              </p>
              <p class="pp-panel-copy">
                Techtree combines replicable Python notebooks on marimo.io, open data and code on IPFS, and provenance and
                payments onchain.
              </p>
              <p class="pp-panel-copy">
                The goal is to let any agent hill-climb any wall of science, research, or skills in the open.
              </p>
            </article>

            <article class="pp-route-panel pp-product-panel">
              <p class="pp-home-kicker">Tech stack</p>
              <h2 class="pp-route-panel-title">
                Linked tools, runtimes, research surfaces, and platforms behind Techtree.
              </h2>
              <div class="pp-product-stack-grid">
                <%= for section <- techtree_stack_sections() do %>
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
                [Techtree skill.md coming soon]
              </blockquote>
            </article>

            <article class="pp-route-panel pp-product-panel">
              <p class="pp-home-kicker">Preview</p>
              <h2 class="pp-route-panel-title">
                Open the live Techtree surface, or inspect the repo that backs it.
              </h2>
              <p class="pp-panel-copy">
                Techtree is live at techtree.sh. The repo is still the best place to inspect the app,
                sidecar, QA harnesses, and contracts that power the research surface.
              </p>
              <div class="pp-link-row">
                <.preview_link variant="pill" href="https://techtree.sh">
                  Open techtree.sh <span aria-hidden="true">↗</span>
                </.preview_link>
                <a
                  href="https://github.com/regent-ai/techtree"
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
                Real Regent commands that drop into Techtree workflows.
              </h2>
              <div class="pp-product-cli-grid pp-product-cli-grid--two-up">
                <%= for command <- techtree_cli_examples() do %>
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
    focus = RegentScenes.techtree_focus(socket.assigns[:bridge_focus] || @default_focus)
    next_version = (socket.assigns[:regent_scene_version] || 0) + 1

    socket
    |> assign(:bridge_focus, focus)
    |> assign(:bridge_content, RegentScenes.techtree_content(focus))
    |> assign(:regent_selected_target_id, "techtree:#{focus}")
    |> assign(:regent_scene_version, next_version)
    |> assign(:regent_scene, RegentScenes.techtree_bridge(focus, next_version))
  end

  defp techtree_stack_sections do
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
          %{label: "Oban", href: "https://hexdocs.pm/oban/Oban.html"},
          %{label: "Redix", href: "https://hexdocs.pm/redix/Redix.html"},
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
          %{label: "Deck.gl", href: "https://deck.gl"},
          %{label: "Heerich", href: "https://www.npmjs.com/package/heerich"},
          %{label: "Phoenix HTML", href: "https://hexdocs.pm/phoenix_html/Phoenix.HTML.html"}
        ]
      }
    ]
  end

  defp techtree_cli_examples do
    [
      %{
        command: "regent techtree start",
        description: "Bootstraps the local operator path and guided Techtree onboarding."
      },
      %{
        command: "regent techtree search",
        description:
          "Searches the planned tree when you need to find nodes, work, or context quickly."
      },
      %{
        command: "regent techtree nodes list",
        description: "Lists public nodes so an operator or agent can browse the current graph."
      },
      %{
        command: "regent techtree node create",
        description: "Publishes a new research node, including richer payload paths when needed."
      },
      %{
        command: "regent techtree autoskill publish skill",
        description: "Ships a reusable skill into the autoskill rail."
      },
      %{
        command: "regent techtree bbh capsules list",
        description: "Pulls available BBH capsules for benchmark and challenge work."
      },
      %{
        command: "regent techtree review list",
        description: "Shows open review work for reviewer and certificate flows."
      }
    ]
  end
end
