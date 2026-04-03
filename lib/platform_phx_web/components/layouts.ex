defmodule PlatformPhxWeb.Layouts do
  use PlatformPhxWeb, :html

  embed_templates "layouts/*"

  attr :flash, :map, required: true, doc: "the map of flash messages"

  attr :current_scope, :map,
    default: nil,
    doc: "the current [scope](https://hexdocs.pm/phoenix/scopes.html)"

  attr :chrome, :atom, default: :app
  attr :active_nav, :string, default: nil
  attr :content_class, :string, default: ""
  attr :theme_class, :string, default: "rg-regent-theme-platform"

  slot :inner_block, required: true

  def app(assigns) do
    ~H"""
    <div
      id="platform-layout-root"
      class={[
        @theme_class,
        "pp-platform-layout min-h-screen"
      ]}
      phx-hook="ColorModeToggle"
    >
      <a
        href="#main-content"
        class="sr-only rounded-xl bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>

      <%= if @chrome == :app do %>
        <div class="mx-auto flex min-h-screen max-w-[1600px] gap-3 p-3 lg:p-4">
          <div class="pp-sidebar-column hidden w-72 shrink-0 self-stretch lg:flex lg:flex-col">
            <aside
              data-background-suppress
              class="pp-sidebar-shell relative isolate z-10 rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--sidebar)] p-5 shadow-[0_24px_70px_-48px_color-mix(in_oklch,var(--brand-ink)_55%,transparent)]"
            >
              <div class="pp-sidebar-brand-row">
                <.link navigate={~p"/"} class="flex items-center gap-3 text-[color:var(--foreground)]">
                  <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)]">
                    <img
                      src={~p"/images/regents-logo.png"}
                      alt="Regent"
                      class="h-9 w-9 rounded-xl object-cover"
                    />
                  </div>
                  <div>
                    <p class="font-display text-[1.7rem] font-black leading-none">Regents Home</p>
                  </div>
                </.link>
              </div>

              <nav class="mt-8 space-y-2" aria-label="Primary">
                <.nav_link current={@active_nav == "overview"} href={~p"/overview"} label="Overview" />
                <.nav_link
                  current={@active_nav == "token-info"}
                  href={~p"/token-info"}
                  label="Platform Token"
                />
                <.nav_link
                  current={@active_nav == "services"}
                  href={~p"/services"}
                  label="Services"
                />
                <.nav_link current={@active_nav == "techtree"} href={~p"/techtree"} label="Techtree" />
                <.nav_link
                  current={@active_nav == "autolaunch"}
                  href={~p"/autolaunch"}
                  label="Autolaunch"
                />
                <.nav_link
                  current={@active_nav == "regent-cli"}
                  href={~p"/regent-cli"}
                  label="Regent CLI"
                />
                <.nav_link
                  current={@active_nav == "bug-report"}
                  href={~p"/bug-report"}
                  label="Bug Report"
                />
                <.external_nav_link
                  href="https://news.regents.sh"
                  label="News"
                />
                <.external_nav_link
                  href="https://github.com/orgs/regent-ai/repositories"
                  label="Github"
                />
                <div id="sidebar-community" class="pp-sidebar-community" phx-hook="SidebarCommunity">
                  <button
                    type="button"
                    class="pp-sidebar-community-toggle"
                    data-community-toggle
                    aria-expanded="false"
                    aria-controls="sidebar-community-drawer"
                  >
                    <span>Community</span>
                    <span aria-hidden="true" data-community-icon>↓</span>
                  </button>

                  <div
                    id="sidebar-community-drawer"
                    class="pp-sidebar-community-drawer"
                    data-community-panel
                    hidden
                  >
                    <div class="pp-sidebar-community-grid">
                      <.community_links />
                    </div>
                  </div>
                </div>
              </nav>
            </aside>
          </div>

          <div class={[
            "pp-platform-content-shell flex min-w-0 flex-1 flex-col rounded-[1.75rem] border border-[color:var(--border)] shadow-[0_26px_70px_-44px_color-mix(in_oklch,var(--brand-ink)_55%,transparent)]",
            @active_nav == "token-info" && "pp-platform-content-shell--token"
          ]}>
            <header
              data-background-suppress
              class="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--border)] px-4 py-4 sm:px-5"
            >
              <div>
                <p class="pp-chrome-eyebrow">
                  {chrome_eyebrow(@active_nav)}
                </p>
                <h1 class="pp-chrome-title">{chrome_title(@active_nav)}</h1>
              </div>
            </header>

            <main
              id="main-content"
              data-background-suppress
              class={["min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6", @content_class]}
              tabindex="-1"
            >
              {render_slot(@inner_block)}
            </main>

            <footer
              data-background-suppress
              class="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--border)] px-5 py-4 text-sm text-[color:var(--muted-foreground)]"
            >
              <p>&copy; Regents Labs 2026</p>
              <.footer_social_links />
            </footer>
          </div>
        </div>
      <% else %>
        <main
          id="main-content"
          class={["mx-auto min-h-screen max-w-[1600px] p-3 sm:p-4", @content_class]}
          tabindex="-1"
        >
          {render_slot(@inner_block)}
        </main>
      <% end %>

      <.flash_group flash={@flash} />
    </div>
    """
  end

  attr :href, :string, required: true
  attr :label, :string, required: true
  attr :current, :boolean, default: false

  defp nav_link(assigns) do
    ~H"""
    <.link
      navigate={@href}
      class={[
        "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition",
        @current &&
          "border-[color:var(--ring)] bg-[color:var(--sidebar-accent)] text-[color:var(--foreground)] shadow-[0_16px_36px_-28px_color-mix(in_oklch,var(--brand-ink)_60%,transparent)]",
        !@current &&
          "border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--muted-foreground)] hover:border-[color:var(--ring)] hover:text-[color:var(--foreground)]"
      ]}
    >
      <span>{@label}</span>
      <span aria-hidden="true">→</span>
    </.link>
    """
  end

  attr :href, :string, required: true
  attr :label, :string, required: true

  defp external_nav_link(assigns) do
    ~H"""
    <a
      href={@href}
      target="_blank"
      rel="noreferrer"
      class="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--muted-foreground)] transition hover:border-[color:var(--ring)] hover:text-[color:var(--foreground)]"
    >
      <span>{@label}</span>
      <span aria-hidden="true">↗</span>
    </a>
    """
  end

  defp community_links(assigns) do
    ~H"""
    <a
      href="https://x.com/regents_sh"
      target="_blank"
      rel="noreferrer"
      class="pp-sidebar-community-link"
      aria-label="Regents Labs on X"
      title="Regents Labs on X"
    >
      <img src={~p"/images/xicon.png"} alt="" class="pp-home-footer-icon-image" />
    </a>

    <a
      href="https://farcaster.xyz/regent"
      target="_blank"
      rel="noreferrer"
      class="pp-sidebar-community-link"
      aria-label="Regent on Farcaster"
      title="Regent on Farcaster"
    >
      <img src={~p"/images/farcastericon.png"} alt="" class="pp-home-footer-icon-image" />
    </a>

    <a
      href="https://discord.gg/regents"
      target="_blank"
      rel="noreferrer"
      class="pp-sidebar-community-link"
      aria-label="Regents on Discord"
      title="Regents on Discord"
    >
      <img src={~p"/images/discordicon.png"} alt="" class="pp-home-footer-icon-image" />
    </a>

    <a
      href="https://github.com/orgs/regent-ai/repositories"
      target="_blank"
      rel="noreferrer"
      class="pp-sidebar-community-link"
      aria-label="Regents Labs GitHub"
      title="Regents Labs GitHub"
    >
      <.github_mark class="size-5" />
    </a>
    """
  end

  def footer_social_links(assigns) do
    ~H"""
    <div class="pp-home-footer-links" aria-label="Regents Labs footer social links">
      <button
        id="platform-footer-voxel-classic"
        type="button"
        class="pp-home-footer-link pp-footer-voxel-toggle"
        phx-hook="FooterVoxel"
        data-color-mode-cycle
        data-background-suppress
        aria-label="Toggle light and dark mode"
        aria-pressed="false"
        title="Toggle light and dark mode"
      >
        <span class="pp-footer-voxel-scene" data-footer-voxel-scene aria-hidden="true"></span>
      </button>

      <a
        href="https://x.com/regents_sh"
        target="_blank"
        rel="noreferrer"
        class="pp-home-footer-link"
        data-background-suppress
        aria-label="Regents Labs on X"
        title="Regents Labs on X"
      >
        <img src={~p"/images/xicon.png"} alt="" class="pp-home-footer-icon-image" />
      </a>

      <a
        href="https://farcaster.xyz/regent"
        target="_blank"
        rel="noreferrer"
        class="pp-home-footer-link"
        data-background-suppress
        aria-label="Regent on Farcaster"
        title="Regent on Farcaster"
      >
        <img src={~p"/images/farcastericon.png"} alt="" class="pp-home-footer-icon-image" />
      </a>

      <a
        href="https://discord.gg/regents"
        target="_blank"
        rel="noreferrer"
        class="pp-home-footer-link"
        data-background-suppress
        aria-label="Regents on Discord"
        title="Regents on Discord"
      >
        <img src={~p"/images/discordicon.png"} alt="" class="pp-home-footer-icon-image" />
      </a>

      <a
        href="https://github.com/orgs/regent-ai/repositories"
        target="_blank"
        rel="noreferrer"
        class="pp-home-footer-link"
        data-background-suppress
        aria-label="Regents Labs GitHub"
        title="Regents Labs GitHub"
      >
        <.github_mark class="size-5" />
      </a>

      <a
        href="https://www.geckoterminal.com/base/pools/0x4ed3b69ac263ad86482f609b2c2105f64bcfd3a7e02e8e078ec9fec1f0324bed"
        target="_blank"
        rel="noreferrer"
        class="pp-home-footer-link"
        data-background-suppress
        aria-label="View $REGENT on GeckoTerminal"
        title="View $REGENT on GeckoTerminal"
      >
        <img src={~p"/images/geckoterminallogo.png"} alt="" class="pp-home-footer-icon-image" />
      </a>
    </div>
    """
  end

  defp chrome_eyebrow("overview"), do: "Regents Overview"
  defp chrome_eyebrow("services"), do: "Services and Docs"
  defp chrome_eyebrow("bug-report"), do: "Public Operator Ledger"
  defp chrome_eyebrow("techtree"), do: "Shared Research and Eval Tree"
  defp chrome_eyebrow("autolaunch"), do: "Raise agent capital"
  defp chrome_eyebrow("regent-cli"), do: "Local Operator Surface"
  defp chrome_eyebrow("token-info"), do: "Platform revenue token"
  defp chrome_eyebrow(_), do: "Regents Labs"

  defp chrome_title("overview"), do: "Overview"
  defp chrome_title("services"), do: "Services"
  defp chrome_title("bug-report"), do: "Bug Report Ledger"
  defp chrome_title("techtree"), do: "Techtree"
  defp chrome_title("autolaunch"), do: "Autolaunch"
  defp chrome_title("regent-cli"), do: "Regent CLI"
  defp chrome_title("token-info"), do: "Agent economies"
  defp chrome_title(_), do: "Regents Home"

  attr :class, :string, default: nil

  defp github_mark(assigns) do
    ~H"""
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class={@class}>
      <path d="M12 2C6.48 2 2 6.58 2 12.22c0 4.5 2.87 8.31 6.84 9.66.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.91-2.78.62-3.37-1.21-3.37-1.21-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .08 1.53 1.06 1.53 1.06.9 1.56 2.35 1.11 2.92.85.09-.67.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05A9.35 9.35 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.64 1.03 2.76 0 3.95-2.34 4.81-4.58 5.07.36.32.68.95.68 1.91 0 1.38-.01 2.49-.01 2.83 0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z" />
    </svg>
    """
  end

  attr :flash, :map, required: true, doc: "the map of flash messages"
  attr :id, :string, default: "flash-group", doc: "the optional id of flash container"

  def flash_group(assigns) do
    ~H"""
    <div id={@id} aria-live="polite">
      <.flash kind={:info} flash={@flash} />
      <.flash kind={:error} flash={@flash} />
    </div>
    """
  end
end
