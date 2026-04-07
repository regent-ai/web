defmodule PlatformPhxWeb.DashboardLive do
  use PlatformPhxWeb, :live_view

  alias PlatformPhx.RuntimeConfig

  @service_cards [
    %{
      eyebrow: "Interactive rail",
      title: "Wallet console",
      body:
        "Connect an account, redeem an Animata pass, and claim a Regent identity from the same operator surface.",
      kind: :anchor,
      href: "#services-wallet-console",
      cta: "Open console"
    },
    %{
      eyebrow: "Token structure",
      title: "Agent economies",
      body:
        "Inspect fee sources, staking flow, buybacks, and the largest token positions without leaving the site.",
      kind: :navigate,
      href: "/token-info",
      cta: "Inspect token"
    },
    %{
      eyebrow: "Operator rail",
      title: "Regent CLI",
      body:
        "Use the local runtime, operator commands, and command groups that connect Regents to real agent work.",
      kind: :navigate,
      href: "/regent-cli",
      cta: "Open CLI guide"
    },
    %{
      eyebrow: "Live product",
      title: "Techtree",
      body:
        "Open the research graph for notebooks, evals, skills, traces, and reproducible work.",
      kind: :external,
      href: "https://techtree.sh",
      cta: "Visit techtree.sh"
    },
    %{
      eyebrow: "Live product",
      title: "Autolaunch",
      body:
        "Open the launch surface for agent capital, auction planning, and revenue-sharing token flows.",
      kind: :external,
      href: "https://autolaunch.sh",
      cta: "Visit autolaunch.sh"
    },
    %{
      eyebrow: "Public ledger",
      title: "Bug report board",
      body:
        "Check the operator ledger for incoming reports, summaries, status changes, and older entries.",
      kind: :navigate,
      href: "/bug-report",
      cta: "Open ledger"
    }
  ]

  @impl true
  @spec mount(map(), map(), Phoenix.LiveView.Socket.t()) ::
          {:ok, Phoenix.LiveView.Socket.t()}
  def mount(_params, _session, socket) do
    config = dashboard_config()

    {:ok,
     socket
     |> assign(:page_title, "Services")
     |> assign(:dashboard_config, Jason.encode!(config))
     |> assign(:service_cards, @service_cards)
     |> assign(:console_readiness, console_readiness(config))}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app
      flash={@flash}
      current_scope={assigns[:current_scope]}
      chrome={:app}
      active_nav="services"
      theme_class="rg-regent-theme-platform"
    >
      <div
        id="platform-dashboard-shell"
        class="pp-dashboard-shell rg-regent-theme-platform"
        phx-hook="DashboardReveal"
      >
        <div class="pp-voxel-background pp-voxel-background--dashboard" aria-hidden="true">
          <div
            id="dashboard-voxel-background"
            class="pp-voxel-background-canvas"
            phx-hook="VoxelBackground"
            data-voxel-background="dashboard"
          >
          </div>
        </div>

        <div class="pp-route-stage">
          <section class="pp-dashboard-hero" data-dashboard-block>
            <article class="pp-route-panel pp-product-panel pp-product-panel--feature">
              <p class="pp-home-kicker">Operator console</p>
              <h2 class="pp-route-panel-title">
                Use Regents from one LiveView surface, then drop into product depth only when you need it.
              </h2>
              <div class="pp-dashboard-copy">
                <p class="pp-panel-copy">
                  This page is now the shared operator shell for wallet actions, identity claims, token inspection, and route handoff across Regents.
                </p>
                <p class="pp-panel-copy">
                  Core navigation, docs, and service discovery stay server-rendered. Browser-owned work is isolated to the wallet console below.
                </p>
              </div>
              <div class="pp-link-row">
                <a href="#services-wallet-console" class="pp-link-button pp-link-button-slim">
                  Open wallet console <span aria-hidden="true">↓</span>
                </a>
                <.link
                  navigate={~p"/token-info"}
                  class="pp-link-button pp-link-button-ghost pp-link-button-slim"
                >
                  Inspect token flows <span aria-hidden="true">→</span>
                </.link>
                <a
                  href="https://techtree.sh"
                  target="_blank"
                  rel="noreferrer"
                  class="pp-link-button pp-link-button-ghost pp-link-button-slim"
                >
                  Visit techtree.sh <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>

            <article class="pp-route-panel pp-product-panel">
              <p class="pp-home-kicker">Environment status</p>
              <h2 class="pp-route-panel-title">What is ready in this deployment</h2>
              <div class="pp-dashboard-readiness-grid">
                <%= for item <- @console_readiness do %>
                  <section class="pp-dashboard-status-card">
                    <p class="pp-home-kicker">{item.label}</p>
                    <p class="pp-dashboard-status-value">{item.value}</p>
                    <p class="pp-panel-copy">{item.note}</p>
                  </section>
                <% end %>
              </div>
            </article>
          </section>

          <section class="pp-dashboard-service-grid" data-dashboard-block aria-label="Service routes">
            <%= for card <- @service_cards do %>
              <article class="pp-route-panel pp-product-panel pp-dashboard-service-card">
                <p class="pp-home-kicker">{card.eyebrow}</p>
                <h2 class="pp-route-panel-title">{card.title}</h2>
                <p class="pp-panel-copy">{card.body}</p>
                <div class="pp-dashboard-service-links">
                  <%= cond do %>
                    <% card.kind == :navigate -> %>
                      <.link navigate={card.href} class="pp-link-button pp-link-button-slim">
                        {card.cta} <span aria-hidden="true">→</span>
                      </.link>
                    <% card.kind == :external -> %>
                      <a
                        href={card.href}
                        target="_blank"
                        rel="noreferrer"
                        class="pp-link-button pp-link-button-slim"
                      >
                        {card.cta} <span aria-hidden="true">↗</span>
                      </a>
                    <% true -> %>
                      <a href={card.href} class="pp-link-button pp-link-button-slim">
                        {card.cta} <span aria-hidden="true">↓</span>
                      </a>
                  <% end %>
                </div>
              </article>
            <% end %>
          </section>

          <section class="pp-route-grid" data-dashboard-block>
            <article
              id="services-wallet-console"
              class="pp-route-panel pp-product-panel pp-route-panel-span pp-dashboard-console-shell"
            >
              <p class="pp-home-kicker">Interactive wallet console</p>
              <h2 class="pp-route-panel-title">
                Wallet auth, Animata redemption, and Regent identity claims live here.
              </h2>
              <p class="pp-panel-copy">
                The surrounding page stays readable and useful without JavaScript. The wallet console below is the only browser-owned section because wallet auth and signing need client-side control.
              </p>

              <noscript>
                <p class="pp-panel-copy">
                  JavaScript is required for wallet auth and transaction signing. You can still use the routes above to inspect token data, docs, and operator rails.
                </p>
              </noscript>

              <div
                id="dashboard-root"
                phx-hook="DashboardRoot"
                phx-update="ignore"
                data-dashboard-config={@dashboard_config}
              >
              </div>
            </article>
          </section>
        </div>
      </div>
    </Layouts.app>
    """
  end

  defp dashboard_config do
    %{
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
        opensea: "/api/opensea",
        openseaRedeemStats: "/api/opensea/redeem-stats"
      }
    }
  end

  defp console_readiness(config) do
    [
      %{
        label: "Wallet auth",
        value: if(present?(config.privyAppId), do: "Live", else: "Missing"),
        note:
          if(
            present?(config.privyAppId),
            do: "Privy login is configured for this environment.",
            else: "Set a Privy app id to turn on wallet login."
          )
      },
      %{
        label: "Redeemer",
        value: shorten_value(config.redeemerAddress),
        note:
          if(
            present?(config.redeemerAddress),
            do: "Redemption and claim reads can target the configured contract.",
            else: "Redeemer actions stay read-only until an address is configured."
          )
      },
      %{
        label: "Base RPC",
        value: rpc_label(config.baseRpcUrl),
        note: "Used for Base reads and wallet-network handoff."
      },
      %{
        label: "UI ownership",
        value: "LiveView first",
        note:
          "Navigation, content, and layout stay in Phoenix. Only the wallet console mounts as a browser island."
      }
    ]
  end

  defp rpc_label(nil), do: "Missing"

  defp rpc_label(url) when is_binary(url) do
    case URI.parse(url) do
      %URI{host: host} when is_binary(host) and host != "" -> host
      _ -> url
    end
  end

  defp present?(value) when value in [nil, ""], do: false
  defp present?(_value), do: true

  defp shorten_value(nil), do: "Missing"

  defp shorten_value(value) when is_binary(value) and byte_size(value) > 14 do
    "#{String.slice(value, 0, 6)}...#{String.slice(value, -4, 4)}"
  end

  defp shorten_value(value), do: value
end
