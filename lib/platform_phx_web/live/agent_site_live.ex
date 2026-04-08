defmodule PlatformPhxWeb.AgentSiteLive do
  use PlatformPhxWeb, :live_view

  alias PlatformPhx.AgentPlatform
  alias PlatformPhxWeb.AgentPlatformComponents

  @impl true
  def mount(%{"slug" => slug}, _session, socket) do
    {:ok,
     socket
     |> assign(:page_title, "Agent Preview")
     |> assign(:agent, AgentPlatform.get_public_agent(slug))
     |> assign(:slug, slug)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app
      flash={@flash}
      current_scope={assigns[:current_scope]}
      chrome={:none}
      theme_class="rg-regent-theme-platform"
      content_class="p-0"
    >
      <div
        id="agent-site-preview-shell"
        class="pp-home-shell rg-regent-theme-platform"
        phx-hook="DashboardReveal"
      >
        <div class="p-4 sm:p-6 lg:p-8">
          <%= if @agent do %>
            <AgentPlatformComponents.public_agent_page agent={
              AgentPlatform.serialize_agent(@agent, :public)
            } />
          <% else %>
            <div class="mx-auto max-w-[760px] rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--card)] p-8">
              <p class="pp-home-kicker">Agent Preview</p>
              <h1 class="pp-route-panel-title mt-3">Agent not found</h1>
              <p class="pp-panel-copy mt-3">
                No published agent matches <code>{@slug}</code>.
              </p>
            </div>
          <% end %>
        </div>
      </div>
    </Layouts.app>
    """
  end
end
