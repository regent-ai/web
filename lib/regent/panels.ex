defmodule Regent.Panels do
  use Phoenix.Component

  @moduledoc """
  Canonical grouped Regent function components for human-readable panels and utility UI.
  """

  attr :id, :string, required: true
  attr :title, :string, required: true
  attr :subtitle, :string, default: nil
  attr :summary, :string, default: nil
  attr :class, :any, default: nil
  attr :rest, :global
  slot :actions
  slot :inner_block, required: true
  slot :footer

  def chamber(assigns) do
    ~H"""
    <section id={@id} class={["rg-chamber", @class]} {@rest}>
      <header class="rg-panel-header">
        <div>
          <h2 class="rg-panel-title">{@title}</h2>
          <p :if={@subtitle} class="rg-panel-subtitle">{@subtitle}</p>
          <p :if={@summary} class="rg-panel-summary">{@summary}</p>
        </div>
        <div :if={@actions != []} class="rg-panel-actions">{render_slot(@actions)}</div>
      </header>

      <div class="rg-panel-body">
        {render_slot(@inner_block)}
      </div>

      <footer :if={@footer != []} class="rg-panel-footer">
        {render_slot(@footer)}
      </footer>
    </section>
    """
  end

  attr :id, :string, required: true
  attr :title, :string, required: true
  attr :subtitle, :string, default: nil
  attr :kind, :string, default: "panel"
  attr :class, :any, default: nil
  attr :rest, :global
  slot :actions
  slot :inner_block, required: true
  slot :footer

  def ledger(assigns) do
    ~H"""
    <section id={@id} class={["rg-ledger", @class, "rg-ledger-#{@kind}"]} {@rest}>
      <header class="rg-panel-header">
        <div>
          <h2 class="rg-panel-title">{@title}</h2>
          <p :if={@subtitle} class="rg-panel-subtitle">{@subtitle}</p>
        </div>
        <div :if={@actions != []} class="rg-panel-actions">{render_slot(@actions)}</div>
      </header>

      <div class="rg-panel-body">
        {render_slot(@inner_block)}
      </div>

      <footer :if={@footer != []} class="rg-panel-footer">
        {render_slot(@footer)}
      </footer>
    </section>
    """
  end

  attr :name, :string, required: true
  attr :title, :string, default: nil
  attr :class, :any, default: nil
  attr :sprite_path, :string, default: "/regent/sigils/regent-sigils.svg"
  attr :rest, :global

  def icon(assigns) do
    ~H"""
    <svg
      class={["rg-icon", @class]}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden={is_nil(@title)}
      {@rest}
    >
      <title :if={@title}>{@title}</title>
      <use href={"#{@sprite_path}##{@name}"} />
    </svg>
    """
  end

  attr :id, :string, required: true
  attr :class, :any, default: nil
  attr :hook, :string, default: "RegentBackground"
  attr :cube_width, :integer, default: 44
  attr :cube_height, :integer, default: 24
  attr :cube_depth, :integer, default: 14
  attr :overscan, :integer, default: 4
  attr :neighbor_radius, :integer, default: 1
  attr :hide_cursor, :boolean, default: true
  attr :rest, :global

  def background_grid(assigns) do
    ~H"""
    <div
      id={@id}
      class={["rg-background-grid", @class]}
      phx-hook={@hook}
      phx-update="ignore"
      data-cube-width={@cube_width}
      data-cube-height={@cube_height}
      data-cube-depth={@cube_depth}
      data-overscan={@overscan}
      data-neighbor-radius={@neighbor_radius}
      data-hide-cursor={if(@hide_cursor, do: "true", else: "false")}
      aria-hidden="true"
      {@rest}
    >
      <svg class="rg-background-grid-svg" />
    </div>
    """
  end
end
