defmodule PlatformPhxWeb.Router do
  use PlatformPhxWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {PlatformPhxWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", PlatformPhxWeb do
    pipe_through :browser

    live "/", HomeLive
    live "/demo", DemoLive
    live "/heerich-demo", HeerichDemoLive

    live_session :platform_app do
      live "/overview", OverviewLive
      live "/logos", LogosLive
      live "/services", DashboardLive
      live "/bug-report", BugReportLive
      live "/techtree", TechtreeLive
      live "/autolaunch", AutolaunchLive
      live "/regent-cli", RegentCliLive
      live "/token-info", TokenInfoLive
    end
  end

  scope "/api", PlatformPhxWeb do
    pipe_through :api

    get "/basenames/config", Api.BasenamesController, :config
    get "/basenames/allowances", Api.BasenamesController, :allowances
    get "/basenames/allowance", Api.BasenamesController, :allowance
    get "/basenames/availability", Api.BasenamesController, :availability
    get "/basenames/credits", Api.BasenamesController, :credits
    get "/basenames/owned", Api.BasenamesController, :owned
    get "/basenames/recent", Api.BasenamesController, :recent
    post "/basenames/credit", Api.BasenamesController, :credit
    post "/basenames/mint", Api.BasenamesController, :mint
    post "/basenames/use", Api.BasenamesController, :use
    post "/bug-report", Api.ReportController, :bug
    post "/security-report", Api.ReportController, :security

    get "/agentlaunch/auctions", Api.AgentLaunchController, :auctions
    get "/opensea", Api.OpenseaController, :index
  end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:platform_phx, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: PlatformPhxWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
