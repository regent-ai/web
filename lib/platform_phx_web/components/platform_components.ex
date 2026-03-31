defmodule PlatformPhxWeb.PlatformComponents do
  @moduledoc false
  use Phoenix.Component
  use Regent

  @bootstrap_command """
  bunx @regent/cli my-agent
  cd my-agent && bun run dev
  """

  attr :card, :map, required: true
  attr :variant, :string, required: true

  def entry_card(assigns) do
    ~H"""
    <article
      id={"platform-entry-card-#{@card.id}-#{@variant}"}
      data-platform-card
      class={[
        "pp-entry-card",
        @card.theme_class
      ]}
    >
      <div class="pp-entry-card-copy">
        <div class="space-y-4">
          <div class="space-y-3">
            <p class="pp-entry-eyebrow">{@card.eyebrow}</p>
            <div class="space-y-3">
              <h2 class="pp-entry-title">{@card.title}</h2>
              <p class="pp-entry-description">{@card.description}</p>
            </div>
          </div>

          <.surface
            id={"entry-card-surface-#{@card.id}-#{@variant}"}
            class={"pp-card-surface pp-surface-single #{@card.theme_class}"}
            scene={@card.scene}
            scene_version={@card.scene_version}
            selected_target_id={@card.selected_target_id}
            theme={@card.theme}
            camera_distance={20}
          />

          <ul class="pp-entry-bullets">
            <%= for bullet <- @card.bullets do %>
              <li>{bullet}</li>
            <% end %>
          </ul>
        </div>

        <div class="pp-entry-footer">
          <p class="pp-entry-note">{@card.note}</p>
          <.link navigate={@card.href} class="pp-entry-link">
            Open <span aria-hidden="true">→</span>
          </.link>
        </div>
      </div>
    </article>
    """
  end

  attr :title, :string, required: true
  attr :summary, :string, required: true
  attr :skill_label, :string, required: true
  attr :skill_command, :string, required: true
  attr :skill_note, :string, required: true

  def cli_bootstrap(assigns) do
    assigns = assign(assigns, :bootstrap_command, @bootstrap_command)

    ~H"""
    <section class="pp-cli-boot" aria-label={"#{@title} CLI setup"}>
      <div class="space-y-3">
        <p class="pp-home-kicker">Regent CLI</p>
        <h2 class="pp-route-panel-title">{@title}</h2>
        <p class="pp-panel-copy">{@summary}</p>
      </div>

      <div class="pp-cli-steps">
        <article class="pp-cli-step">
          <div class="space-y-2">
            <p class="pp-home-kicker">1. Scaffold + start</p>
            <p class="pp-panel-copy">
              Bootstrap a fresh Regent project locally, then bring up the starter flow.
            </p>
          </div>

          <code class="pp-command">{@bootstrap_command}</code>
        </article>

        <article class="pp-cli-step">
          <div class="space-y-2">
            <p class="pp-home-kicker">{@skill_label}</p>
            <p class="pp-panel-copy">{@skill_note}</p>
          </div>

          <code class="pp-command">{@skill_command}</code>
        </article>
      </div>
    </section>
    """
  end

  attr :sample, :map, required: true

  def hover_cycle_demo(assigns) do
    ~H"""
    <article
      id={"platform-heerich-demo-#{@sample.id}"}
      class={[
        "pp-demo-card",
        @sample.theme_class
      ]}
      data-demo-card
    >
      <div class="pp-demo-card-copy">
        <div class="space-y-3">
          <p class="pp-entry-eyebrow">{@sample.eyebrow}</p>
          <div class="space-y-3">
            <h2 class="pp-route-panel-title">{@sample.title}</h2>
            <p class="pp-panel-copy">{@sample.description}</p>
          </div>
        </div>

        <.surface
          id={"platform-heerich-demo-surface-#{@sample.id}"}
          class={"pp-demo-surface pp-surface-single #{@sample.theme_class}"}
          scene={@sample.scene}
          scene_version={@sample.scene_version}
          selected_target_id={@sample.selected_target_id}
          theme={@sample.theme}
          camera_distance={@sample.camera_distance}
        />

        <dl class="pp-demo-settings" aria-label={"#{@sample.title} settings"}>
          <%= for {label, value} <- @sample.settings do %>
            <div>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          <% end %>
        </dl>

        <p class="pp-demo-note">{@sample.note}</p>
      </div>
    </article>
    """
  end
end
