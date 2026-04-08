defmodule PlatformPhxWeb.AgentPlatformComponents do
  @moduledoc false
  use Phoenix.Component

  use Regent

  import PlatformPhxWeb.PlatformComponents, only: [preview_link: 1]

  attr :agent, :map, required: true
  attr :preview_path, :string, default: nil

  def agent_market_card(assigns) do
    ~H"""
    <article
      data-platform-card
      class="pp-route-panel pp-product-panel flex h-full flex-col gap-5 overflow-hidden"
    >
      <div class="space-y-3">
        <p class="pp-home-kicker">Built-in Example</p>
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-2">
            <h2 class="pp-route-panel-title">{@agent.name}</h2>
            <p class="pp-panel-copy">{@agent.public_summary}</p>
          </div>
          <div class="rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
            {@agent.subdomain && @agent.subdomain.hostname}
          </div>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-4">
          <p class="pp-home-kicker">Services</p>
          <div class="mt-3 space-y-3">
            <%= for service <- Enum.take(@agent.services || [], 2) do %>
              <div class="space-y-1">
                <div class="flex items-center justify-between gap-3">
                  <p class="font-display text-[1rem] leading-none">{service.name}</p>
                  <span class="text-xs uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                    {service.payment_rail}
                  </span>
                </div>
                <p class="text-sm text-[color:var(--muted-foreground)]">{service.summary}</p>
                <p class="text-sm text-[color:var(--foreground)]">{service.price_label}</p>
              </div>
            <% end %>
          </div>
        </div>

        <div class="rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-4">
          <p class="pp-home-kicker">Operator Rails</p>
          <div class="mt-3 grid gap-2">
            <div class="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm">
              <span>Sprite + Paperclip</span>
              <span class="text-[color:var(--muted-foreground)]">Regents-managed</span>
            </div>
            <%= for connection <- @agent.connections || [] do %>
              <div class="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm">
                <span class="capitalize">{connection.kind}</span>
                <span class="text-[color:var(--muted-foreground)]">{connection.status}</span>
              </div>
            <% end %>
          </div>
        </div>
      </div>

      <div class="mt-auto flex flex-wrap gap-3">
        <.preview_link
          :if={@agent.subdomain && @agent.subdomain.active}
          variant="pill"
          href={"https://#{@agent.subdomain.hostname}"}
        >
          Open public page <span aria-hidden="true">↗</span>
        </.preview_link>
        <.link
          :if={@preview_path}
          navigate={@preview_path}
          class="pp-link-button pp-link-button-ghost pp-link-button-slim"
        >
          Open preview <span aria-hidden="true">→</span>
        </.link>
      </div>
    </article>
    """
  end

  attr :agent, :map, required: true

  def public_agent_page(assigns) do
    ~H"""
    <div class="mx-auto flex max-w-[1240px] flex-col gap-6">
      <section class="pp-route-panel pp-product-panel pp-product-panel--feature overflow-hidden">
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
          <div class="space-y-5">
            <div class="space-y-3">
              <p class="pp-home-kicker">Regents Agent</p>
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="font-display text-[clamp(2.5rem,5vw,4.8rem)] leading-[0.9]">
                  {@agent.name}
                </h1>
                <span class="rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                  {@agent.subdomain && @agent.subdomain.hostname}
                </span>
              </div>
              <p class="max-w-[58ch] text-base leading-7 text-[color:var(--muted-foreground)]">
                {@agent.hero_statement || @agent.public_summary}
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <div class="rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3">
                <p class="pp-home-kicker">Claimed Name</p>
                <p class="mt-2 text-sm">{@agent.basename_fqdn}</p>
              </div>
              <div class="rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3">
                <p class="pp-home-kicker">ENS Rail</p>
                <p class="mt-2 text-sm">{@agent.ens_fqdn}</p>
              </div>
              <div class="rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3">
                <p class="pp-home-kicker">Operator Runtime</p>
                <p class="mt-2 max-w-[28ch] text-sm text-[color:var(--muted-foreground)]">
                  Private Sprite + Paperclip company managed by Regents with a Hermes worker behind the public storefront.
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--card)] p-5">
            <p class="pp-home-kicker">Connection Menu</p>
            <div class="mt-4 grid gap-3">
              <div class="rounded-xl border border-[color:var(--border)] bg-[color:var(--card-elevated)] px-4 py-3">
                <div>
                  <p class="font-display text-[1rem] leading-none">Private runtime</p>
                  <p class="mt-1 text-sm text-[color:var(--muted-foreground)]">
                    The Sprite URL and Paperclip dashboard stay private until an authorized operator opens them from Regents.
                  </p>
                </div>
              </div>
              <%= for connection <- @agent.connections || [] do %>
                <div class="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--card-elevated)] px-4 py-3">
                  <div>
                    <p class="font-display text-[1rem] leading-none capitalize">{connection.kind}</p>
                    <p class="mt-1 text-sm text-[color:var(--muted-foreground)]">
                      {connection.display_name}
                    </p>
                  </div>
                  <span class="text-xs uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                    {connection.status}
                  </span>
                </div>
              <% end %>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <article class="pp-route-panel pp-product-panel space-y-4">
          <div class="space-y-2">
            <p class="pp-home-kicker">Service Menu</p>
            <h2 class="pp-route-panel-title">Paid agent services</h2>
          </div>

          <div class="grid gap-4">
            <%= for service <- @agent.services || [] do %>
              <section class="rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="space-y-1">
                    <h3 class="font-display text-[1.15rem] leading-none">{service.name}</h3>
                    <p class="text-sm text-[color:var(--muted-foreground)]">{service.summary}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-[color:var(--foreground)]">{service.price_label}</p>
                    <p class="text-xs uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                      {service.payment_rail}
                    </p>
                  </div>
                </div>
              </section>
            <% end %>
          </div>
        </article>

        <article class="pp-route-panel pp-product-panel space-y-4">
          <div class="space-y-2">
            <p class="pp-home-kicker">Public Work Feed</p>
            <h2 class="pp-route-panel-title">Recent finished work</h2>
          </div>

          <div class="grid gap-4">
            <%= for artifact <- @agent.feed || [] do %>
              <section class="rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-4">
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <h3 class="font-display text-[1.1rem] leading-none">{artifact.title}</h3>
                    <span class="text-xs uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                      {artifact.published_at}
                    </span>
                  </div>
                  <p class="text-sm text-[color:var(--muted-foreground)]">{artifact.summary}</p>
                  <a
                    :if={artifact.url}
                    href={artifact.url}
                    target="_blank"
                    rel="noreferrer"
                    class="inline-flex items-center gap-2 text-sm text-[color:var(--link-color)] underline decoration-[color:var(--link-underline)] underline-offset-4"
                  >
                    View public output <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </section>
            <% end %>
          </div>
        </article>
      </section>
    </div>
    """
  end
end
