defmodule PlatformPhxWeb.TokenInfoLive do
  use PlatformPhxWeb, :live_view

  alias PlatformPhx.TokenMarketData

  @holders [
    %{
      rank: 1,
      label: "Clanker Vault",
      address: "0x8E845EAd15737bF71904A30BdDD3aEE76d6ADF6C",
      short: "0x8E84...DF6C",
      percent: "40.00%",
      amount: "40.0B",
      description:
        "Clanker Vault. This is the long-term locked vault attached to the Clanker deployment and vesting schedule.",
      link_label: "View on Clanker",
      link_url: "https://clanker.world/clanker/0x6f89bcA4eA5931EdFCB09786267b251DeE752b07"
    },
    %{
      rank: 2,
      label: "Regent Multisig",
      address: "0x9fa152B0EAdbFe9A7c5C0a8e1D11784f22669a3e",
      short: "0x9fa1...9a3e",
      percent: "36.52%",
      amount: "36.5B",
      description:
        "Regent Multisig. This is the main team-controlled Safe that receives and manages the Regent Labs allocation buckets.",
      link_label: "View Safe",
      link_url:
        "https://app.safe.global/balances?safe=base:0x9fa152B0EAdbFe9A7c5C0a8e1D11784f22669a3e"
    },
    %{
      rank: 3,
      label: "Uniswap V4 Pool Liquidity",
      address: "0x498581fF718922c3f8e6A244956aF099B2652b2b",
      short: "0x4985...2b2b",
      percent: "8.26%",
      amount: "8.2B",
      description:
        "Uniswap V4 Pool Liquidity. This address is the pool manager position holding the liquidity allocated to the market.",
      link_label: "View on BaseScan",
      link_url: "https://basescan.org/address/0x498581ff718922c3f8e6a244956af099b2652b2b"
    },
    %{
      rank: 4,
      label: "Animata Redeem Contract",
      address: "0x71065b775a590c43933F10c0055dc7d74AfAbb0e",
      short: "0x7106...bb0e",
      percent: "2.98%",
      amount: "2.9B",
      description:
        "Animata Redeem Contract with roughly 3B still remaining to disburse. This is the locked onchain pool for the Animata redemption program.",
      link_label: "View redeem contract",
      link_url:
        "https://basescan.org/address/0x71065b775a590c43933F10c0055dc7d74AfAbb0e#asset-tokens"
    },
    %{
      rank: 5,
      label: "Unknown Whale",
      address: "0x301F742573c76ee107cb8E263f2D5c009EcBFB28",
      short: "0x301F...fB28",
      percent: "2.50%",
      amount: "2.5B",
      description: "Unknown holder who accumulated 2.5% of supply"
    },
    %{
      rank: 6,
      label: "Protocol-owned Liquidity on Hydrex",
      address: "0x46F4149cEA5556BD013D4f031D3E3B65573FC002",
      short: "0x46F4...C002",
      percent: "0.88%",
      amount: "880.2M",
      description:
        "Protocol-owned liquidity on Hydrex. These tokens were acquired from buybacks and sit in the liquidity address tied to that pool.",
      link_label: "View Hydrex pool",
      link_url: "https://www.hydrex.fi/pools?search=regent"
    }
  ]

  @allocations [
    %{
      title: "20% to Clanker Deployment",
      body: [
        "On Nov 6th, 2025, the $REGENT token launched via Clanker. A 4.65 eth creator buy, split between 16 individuals, acquired 6.5% of tokens. These are locked until May 6th, 2026 and become liquid then.",
        "Consequently 13.5% of tokens were circulating immediately, and the full 20% will be circulating on May 6th."
      ]
    },
    %{
      title: "40% Regents Labs Multisig",
      bullets: [
        %{
          label: "10% for Animata program",
          details: [
            "Locked onchain in the redemption contract immediately on admin receipt.",
            "Accessible to buy for Animata pass holders starting 3 days after the Clanker token launch.",
            "As of Feb 11th 2026, 71.5% of NFTs had been redeemed, leading to 7.15% of the 10% becoming liquid."
          ]
        },
        %{
          label: "10% for Agent Coin fee rewards",
          details: [
            "A new form of revenue mining that rewards agent creators who bring protocol revenue.",
            "Locked onchain in the Regent contracts once those smart contracts are completed and audited."
          ]
        },
        %{
          label: "10% OTC for protocol growth and subsidizing agent API costs.",
          details: []
        },
        %{
          label: "10% Ecosystem Fund",
          details: [
            "Allocated to reward agent builders and high-value partnerships."
          ]
        }
      ]
    },
    %{
      title: "40% Clanker Vault - Locked onchain for 1 year then vesting over 2 years",
      bullets: [
        %{
          label: "20% Company Treasury",
          details: [
            "Used for employee incentives and OTC deals."
          ]
        },
        %{
          label: "20% Sovereign Agent Incentives",
          details: [
            "These tokens are only to be used when economic agents are clearly here and a quorum of $REGENT holders agrees to it.",
            "The intent is to hold these until there is a credible way to reward sovereign agents for participating in the Regent ecosystem."
          ]
        }
      ],
      link_label: "View on Clanker",
      link_url: "https://clanker.world/clanker/0x6f89bcA4eA5931EdFCB09786267b251DeE752b07"
    }
  ]

  @economics_sources [
    %{
      title: "Autolaunch",
      short: "Hook + auction fees",
      body_html:
        "<span class=\"pp-token-fee-highlight\">1%</span> of every agent token's trading fees from the Uniswap v4 fee hook<br /><span class=\"pp-token-fee-highlight\">2%</span> of raised USDC in CCA auctions."
    },
    %{
      title: "Techtree",
      short: "Agent token earnings",
      body_html: "<span class=\"pp-token-fee-highlight\">1%</span> of agent token earnings."
    },
    %{
      title: "Stablecoin Revenues",
      short: "Revsplit-tracked gross revenue",
      body_html:
        "<span class=\"pp-token-fee-highlight\">1%</span> of gross revenue for all agents, from x402, MPP, and other sources. Tracked onchain through the revsplit contract."
    },
    %{
      title: "Regents Platform",
      short: "Hosted agent margin fees",
      body:
        "Openclaw and Hermes agent hosting, with Stripe LLM billing for margin fees on hosted Regents."
    }
  ]

  @impl true
  def mount(_params, _session, socket) do
    token_market_summary =
      case TokenMarketData.fetch_summary() do
        {:ok, summary} -> summary
        {:error, _reason} -> %{market_cap_display: "--", fdv_display: "--"}
      end

    {:ok,
     socket
     |> assign(:page_title, "Platform Token")
     |> assign(:economics_sources, @economics_sources)
     |> assign(:holders, @holders)
     |> assign(:allocations, @allocations)
     |> assign(:token_market_summary, token_market_summary)
     |> assign(:open_holder, nil)}
  end

  @impl true
  def handle_event("toggle_holder", %{"rank" => rank}, socket) when is_binary(rank) do
    case Integer.parse(rank) do
      {parsed_rank, ""} ->
        next =
          if socket.assigns.open_holder == parsed_rank do
            nil
          else
            parsed_rank
          end

        {:noreply, assign(socket, :open_holder, next)}

      _other ->
        {:noreply, socket}
    end
  end

  def handle_event("toggle_holder", _params, socket), do: {:noreply, socket}

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app
      flash={@flash}
      current_scope={assigns[:current_scope]}
      chrome={:app}
      active_nav="token-info"
      theme_class="rg-regent-theme-platform"
    >
      <div
        id="platform-token-info-shell"
        class="pp-route-shell rg-regent-theme-platform"
        phx-hook="BridgeReveal"
      >
        <div class="pp-route-stage">
          <section
            id="platform-token-economics"
            class="pp-route-panel pp-token-panel pp-token-economics-shell"
            data-bridge-block
          >
            <div class="pp-token-economics-head">
              <div class="pp-token-economics-copy">
                <p class="pp-home-kicker">Token Purpose</p>
                <div class="pp-token-purpose-block">
                  <h2 class="pp-route-panel-title pp-token-purpose-title">
                    <span>$REGENT is staked to earn your share of protocol revenue.</span>
                    <span class="pp-token-purpose-title-break">
                      The majority of revenue is used to buyback $REGENT.
                    </span>
                  </h2>
                </div>
              </div>

              <div class="pp-token-metrics-card" aria-label="Token valuation metrics">
                <div class="pp-token-metrics-band pp-token-metrics-band-primary">
                  <p class="pp-token-metrics-line">
                    <span class="pp-token-metrics-label">Market Cap:</span>
                    <span class="pp-token-metrics-value">
                      {@token_market_summary.market_cap_display}
                    </span>
                  </p>
                </div>
                <div class="pp-token-metrics-divider" aria-hidden="true"></div>
                <div class="pp-token-metrics-band">
                  <p class="pp-token-metrics-line">
                    <span class="pp-token-metrics-label">FDV:</span>
                    <span class="pp-token-metrics-value">{@token_market_summary.fdv_display}</span>
                  </p>
                </div>
              </div>

              <div class="pp-token-market-callout">
                <p class="pp-home-kicker">Live Markets</p>
                <h3 class="pp-token-market-title">$REGENT is live on Base</h3>

                <div class="pp-token-economics-actions">
                  <a
                    href="https://app.uniswap.org/explore/tokens/base/0x6f89bca4ea5931edfcb09786267b251dee752b07?inputCurrency=NATIVE"
                    target="_blank"
                    rel="noreferrer"
                    class="pp-token-header-icon"
                    aria-label="View on Uniswap"
                    title="View on Uniswap"
                  >
                    <img
                      src={~p"/images/uniswaplogo.png"}
                      alt="Uniswap"
                      class="pp-token-header-logo"
                    />
                  </a>
                  <a
                    href="https://www.geckoterminal.com/base/pools/0x4ed3b69ac263ad86482f609b2c2105f64bcfd3a7e02e8e078ec9fec1f0324bed"
                    target="_blank"
                    rel="noreferrer"
                    class="pp-token-header-icon"
                    aria-label="View on GeckoTerminal"
                    title="View on GeckoTerminal"
                  >
                    <img
                      src={~p"/images/geckoterminallogo.png"}
                      alt="GeckoTerminal"
                      class="pp-token-header-logo"
                    />
                  </a>
                  <a
                    href="https://dexscreener.com/base/0x4ed3b69ac263ad86482f609b2c2105f64bcfd3a7e02e8e078ec9fec1f0324bed"
                    target="_blank"
                    rel="noreferrer"
                    class="pp-token-header-icon"
                    aria-label="View on Dexscreener"
                    title="View on Dexscreener"
                  >
                    <img
                      src={~p"/images/dexscreenerlogo.png"}
                      alt="Dexscreener"
                      class="pp-token-header-logo"
                    />
                  </a>
                </div>
              </div>
            </div>

            <div class="pp-token-economics-grid">
              <div class="pp-token-economics-column">
                <div class="pp-token-economics-column-head">
                  <p class="pp-home-kicker">Platform fee sources</p>
                  <h3 class="pp-token-allocation-title">Where revenue enters the system</h3>
                </div>

                <div class="pp-token-economics-source-list">
                  <article :for={source <- @economics_sources} class="pp-token-source-card">
                    <p class="pp-token-source-title">{source.title}</p>
                    <p class="pp-token-source-short">{source.short}</p>
                    <p class="pp-panel-copy">
                      <%= if Map.has_key?(source, :body_html) do %>
                        {Phoenix.HTML.raw(source.body_html)}
                      <% else %>
                        {source.body}
                      <% end %>
                    </p>
                  </article>
                </div>
              </div>

              <div class="pp-token-economics-column">
                <div class="pp-token-economics-column-head">
                  <p class="pp-home-kicker">Staking flow</p>
                  <h3 class="pp-token-allocation-title">How fees are split</h3>
                </div>

                <article class="pp-token-economics-detail-card">
                  <p class="pp-token-source-title">
                    Stake $REGENT in the protocol revsplit contract.
                  </p>
                  <p class="pp-token-source-explainer">
                    Claim your stablecoin share of Regent Labs revenue anytime.
                  </p>
                </article>

                <article class="pp-token-economics-detail-card pp-token-economics-detail-card-accent">
                  <p class="pp-token-source-title">Buyback happens after the staker share</p>
                  <p class="pp-panel-copy">
                    After the revenue split owed to stakers is accounted for, the remaining balance
                    is used to buy back $REGENT. At launch only ~20% of tokens are circulating, so
                    80% or more of protocol skim will go to buybacks.
                  </p>
                </article>

                <article class="pp-token-economics-detail-card">
                  <p class="pp-token-source-title">$REGENT staking emissions</p>
                  <p class="pp-token-source-short">20% yield for initial year</p>
                  <p class="pp-panel-copy">
                    As the protocol builds this first year, an emissions reward of 20% of staked $REGENT
                    will be streamed to stakers. The staking portal and emission claims will open through Autolaunch.
                  </p>
                </article>
              </div>
            </div>
          </section>

          <section class="pp-route-panel pp-token-panel" data-bridge-block>
            <div class="pp-token-section-copy">
              <p class="pp-home-kicker">Token Holders</p>
              <h2 class="pp-route-panel-title">
                Snapshot of largest token locks, pools, and holders
              </h2>
              <p class="pp-panel-copy">
                As of 4/1/2026 the large majority of tokens are locked or held by the following 6 addresses. View the details to see what each address or smart contract is doing.
              </p>
            </div>

            <div class="pp-token-table-wrap">
              <table class="pp-token-table" aria-label="Top $REGENT holders">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Address</th>
                    <th>%</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <%= for holder <- @holders do %>
                    <tr class="pp-token-row">
                      <td class="pp-token-rank" data-label="Rank">#{holder.rank}</td>
                      <td data-label="Address">
                        <div class="pp-token-address-cell">
                          <p class="pp-token-label">{holder.label}</p>
                          <a
                            href={"https://basescan.org/address/#{holder.address}"}
                            target="_blank"
                            rel="noreferrer"
                            class="pp-token-address"
                          >
                            {holder.short} <span aria-hidden="true">↗</span>
                          </a>
                        </div>
                      </td>
                      <td class="pp-token-metric" data-label="Share">{holder.percent}</td>
                      <td data-label="Amount">
                        <div class="pp-token-amount-cell">
                          <span class="pp-token-metric">{holder.amount}</span>
                          <div class="pp-token-bar">
                            <div
                              class="pp-token-bar-fill"
                              style={"width: #{String.trim_trailing(holder.percent, "%")}%"}
                            >
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="pp-token-action" data-label="Details">
                        <button
                          type="button"
                          class="pp-token-toggle"
                          phx-click="toggle_holder"
                          phx-value-rank={holder.rank}
                        >
                          {if @open_holder == holder.rank, do: "Hide", else: "Details"}
                        </button>
                      </td>
                    </tr>
                    <tr :if={@open_holder == holder.rank} class="pp-token-drawer-row">
                      <td colspan="5">
                        <div class="pp-token-drawer">
                          <p class="pp-token-drawer-title">What this address is</p>
                          <p class="pp-panel-copy">{holder.description}</p>
                          <a
                            :if={Map.has_key?(holder, :link_url)}
                            href={holder.link_url}
                            target="_blank"
                            rel="noreferrer"
                            class="pp-link-button"
                          >
                            {holder.link_label} <span aria-hidden="true">↗</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  <% end %>
                </tbody>
              </table>
            </div>

            <p class="pp-token-community-note">7th through 2,208th: Regent Community Members!</p>
          </section>

          <section class="pp-route-panel pp-token-panel" data-bridge-block>
            <p class="pp-home-kicker">Token Allocations</p>
            <h2 class="pp-route-panel-title">Regent Token Allocations and Uses</h2>
            <p class="pp-panel-copy">
              At Clanker token deployment, the following extensions were configured: 20% Clanker public + 40% growth emissions + 40% long-term incentives.
            </p>

            <div class="pp-token-allocation-stack">
              <%= for block <- @allocations do %>
                <section class="pp-token-allocation-block">
                  <h3 class="pp-token-allocation-title">{block.title}</h3>

                  <div :if={Map.has_key?(block, :body)} class="pp-token-prose">
                    <%= for paragraph <- block.body do %>
                      <p>{paragraph}</p>
                    <% end %>
                  </div>

                  <div :if={Map.has_key?(block, :bullets)} class="pp-token-bullet-stack">
                    <article :for={entry <- block.bullets} class="pp-token-bullet-card">
                      <p class="pp-token-bullet-title">{entry.label}</p>
                      <ul :if={entry.details != []} class="pp-token-detail-list">
                        <li :for={detail <- entry.details}>{detail}</li>
                      </ul>
                    </article>
                  </div>

                  <a
                    :if={Map.has_key?(block, :link_url)}
                    href={block.link_url}
                    target="_blank"
                    rel="noreferrer"
                    class="pp-link-button"
                  >
                    {block.link_label} <span aria-hidden="true">↗</span>
                  </a>
                </section>
              <% end %>
            </div>
          </section>
        </div>
      </div>
    </Layouts.app>
    """
  end
end
