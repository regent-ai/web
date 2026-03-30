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
    <div class={[
      @theme_class,
      "pp-platform-layout min-h-screen bg-[radial-gradient(circle_at_12%_14%,color-mix(in_oklch,var(--accent)_18%,transparent),transparent_34%),radial-gradient(circle_at_84%_16%,color-mix(in_oklch,var(--chart-3)_12%,transparent),transparent_32%),linear-gradient(180deg,color-mix(in_oklch,var(--background)_88%,var(--brand-paper)_12%),var(--background))]"
    ]}>
      <a
        href="#main-content"
        class="sr-only rounded-xl bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>

      <%= if @chrome == :app do %>
        <div class="mx-auto flex min-h-screen max-w-[1600px] gap-3 p-3 lg:p-4">
          <aside class="hidden w-72 shrink-0 rounded-[1.75rem] border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--sidebar)_86%,transparent)] p-5 shadow-[0_24px_70px_-48px_color-mix(in_oklch,var(--brand-ink)_55%,transparent)] lg:flex lg:flex-col">
            <div class="space-y-3">
              <.link navigate={~p"/"} class="flex items-center gap-3 text-[color:var(--foreground)]">
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--card)_92%,transparent)]">
                  <img src={~p"/images/logo.svg"} alt="Regent" class="h-7 w-7" />
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
                    Phoenix Twin
                  </p>
                  <p class="font-display text-xl">Regent</p>
                </div>
              </.link>
              <p class="max-w-xs text-sm leading-6 text-[color:var(--muted-foreground)]">
                Identity, launch, and redeem surfaces rebuilt in Phoenix with a smaller navigation shell.
              </p>
            </div>

            <nav class="mt-8 space-y-2" aria-label="Primary">
              <.nav_link current={@active_nav == "dashboard"} href={~p"/dashboard"} label="Dashboard" />
              <.nav_link current={@active_nav == "techtree"} href={~p"/techtree"} label="Techtree" />
              <.nav_link
                current={@active_nav == "autolaunch"}
                href={~p"/autolaunch"}
                label="Autolaunch"
              />
            </nav>

            <div class="mt-auto rounded-[1.5rem] border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_72%,transparent)] p-4">
              <p class="text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
                Hard cutover
              </p>
              <p class="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]">
                This app only keeps the four retained public routes. The rest of the old site is intentionally absent here.
              </p>
            </div>
          </aside>

          <div class="flex min-w-0 flex-1 flex-col rounded-[1.75rem] border border-[color:var(--border)] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--card)_82%,transparent),color-mix(in_oklch,var(--card)_94%,var(--background)_6%)),radial-gradient(circle_at_top,color-mix(in_oklch,var(--accent)_14%,transparent),transparent_46%)] shadow-[0_26px_70px_-44px_color-mix(in_oklch,var(--brand-ink)_55%,transparent)]">
            <header class="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--border)] px-5 py-4">
              <div>
                <p class="text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
                  Regent Platform
                </p>
                <h1 class="font-display text-2xl">Phoenix Surface</h1>
              </div>
              <div class="flex items-center gap-2 lg:hidden">
                <.nav_chip
                  current={@active_nav == "dashboard"}
                  href={~p"/dashboard"}
                  label="Dashboard"
                />
                <.nav_chip current={@active_nav == "techtree"} href={~p"/techtree"} label="Techtree" />
                <.nav_chip
                  current={@active_nav == "autolaunch"}
                  href={~p"/autolaunch"}
                  label="Autolaunch"
                />
              </div>
            </header>

            <main
              id="main-content"
              class={["min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6", @content_class]}
              tabindex="-1"
            >
              {render_slot(@inner_block)}
            </main>
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
          "border-[color:var(--ring)] bg-[color:color-mix(in_oklch,var(--sidebar-accent)_80%,transparent)] text-[color:var(--foreground)] shadow-[0_16px_36px_-28px_color-mix(in_oklch,var(--brand-ink)_60%,transparent)]",
        !@current &&
          "border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_58%,transparent)] text-[color:var(--muted-foreground)] hover:border-[color:var(--ring)] hover:text-[color:var(--foreground)]"
      ]}
    >
      <span>{@label}</span>
      <span aria-hidden="true">→</span>
    </.link>
    """
  end

  attr :href, :string, required: true
  attr :label, :string, required: true
  attr :current, :boolean, default: false

  defp nav_chip(assigns) do
    ~H"""
    <.link
      navigate={@href}
      class={[
        "rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.16em] transition",
        @current &&
          "border-[color:var(--ring)] bg-[color:color-mix(in_oklch,var(--accent)_28%,transparent)] text-[color:var(--foreground)]",
        !@current &&
          "border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_72%,transparent)] text-[color:var(--muted-foreground)]"
      ]}
    >
      {@label}
    </.link>
    """
  end

  attr :flash, :map, required: true, doc: "the map of flash messages"
  attr :id, :string, default: "flash-group", doc: "the optional id of flash container"

  def flash_group(assigns) do
    ~H"""
    <div id={@id} aria-live="polite">
      <.flash kind={:info} flash={@flash} />
      <.flash kind={:error} flash={@flash} />

      <.flash
        id="client-error"
        kind={:error}
        title={gettext("We can't find the internet")}
        phx-disconnected={show(".phx-client-error #client-error") |> JS.remove_attribute("hidden")}
        phx-connected={hide("#client-error") |> JS.set_attribute({"hidden", ""})}
        hidden
      >
        {gettext("Attempting to reconnect")}
        <.icon name="hero-arrow-path" class="ml-1 size-3 motion-safe:animate-spin" />
      </.flash>

      <.flash
        id="server-error"
        kind={:error}
        title={gettext("Something went wrong!")}
        phx-disconnected={show(".phx-server-error #server-error") |> JS.remove_attribute("hidden")}
        phx-connected={hide("#server-error") |> JS.set_attribute({"hidden", ""})}
        hidden
      >
        {gettext("Attempting to reconnect")}
        <.icon name="hero-arrow-path" class="ml-1 size-3 motion-safe:animate-spin" />
      </.flash>
    </div>
    """
  end
end
