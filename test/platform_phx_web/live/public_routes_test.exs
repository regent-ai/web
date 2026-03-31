defmodule PlatformPhxWeb.PublicRoutesTest do
  use PlatformPhxWeb.ConnCase, async: true

  import Phoenix.LiveViewTest

  test "retained public routes render", %{conn: conn} do
    {:ok, _home, home_html} = live(conn, "/")
    assert home_html =~ "Train agents inside Techtree"
    assert home_html =~ "Open the combined dashboard"
    assert home_html =~ "platform-home-shell"
    assert home_html =~ "entry-card-surface-techtree-desktop"
    assert home_html =~ "entry-card-surface-autolaunch-desktop"
    assert home_html =~ "entry-card-surface-dashboard-desktop"
    assert home_html =~ "entry-card-surface-techtree-mobile"
    assert home_html =~ "entry-card-surface-autolaunch-mobile"
    assert home_html =~ "entry-card-surface-dashboard-mobile"
    assert home_html =~ "data-scene-json="
    assert home_html =~ "autolaunch-home-cluster"

    {:ok, _dashboard, dashboard_html} = live(conn, "/dashboard")
    assert dashboard_html =~ "Ops citadel"
    assert dashboard_html =~ "platform-dashboard-surface"
    assert dashboard_html =~ "dashboard-root"
    assert dashboard_html =~ "bunx @regent/cli my-agent"
    assert dashboard_html =~ "curl -fsSL https://regents.sh/skill.md"

    {:ok, _demo, demo_html} = live(conn, "/heerich-demo")
    assert demo_html =~ "Heerich 0.5.0 Lab"
    assert demo_html =~ "platform-heerich-demo-shell"
    assert demo_html =~ "platform-heerich-demo-surface-default-primitive"
    assert demo_html =~ "platform-heerich-demo-surface-explode-cluster"
    assert demo_html =~ "platform-heerich-demo-surface-scaled-voxels"
    assert demo_html =~ "platform-procedural-demo-where"
    assert demo_html =~ "platform-procedural-demo-style"
    assert demo_html =~ "platform-procedural-demo-scale"
    assert demo_html =~ "hoverCycle: true"
    assert demo_html =~ "includeMarker"
    assert demo_html =~ "includePolygons"
    assert demo_html =~ "loopDelayMs"
    assert demo_html =~ "demo-explode-cluster"
    assert demo_html =~ "addWhere"
    assert demo_html =~ "styleBox / styleLine"

    {:ok, _techtree, techtree_html} = live(conn, "/techtree")
    assert techtree_html =~ "platform-techtree-surface"
    assert techtree_html =~ "Open techtree.sh"
    assert techtree_html =~ "rg-regent-theme-techtree"
    assert techtree_html =~ "curl -fsSL https://techtree.sh/skill.md"

    {:ok, _autolaunch, autolaunch_html} = live(conn, "/autolaunch")
    assert autolaunch_html =~ "platform-autolaunch-surface"
    assert autolaunch_html =~ "Open autolaunch.sh"
    assert autolaunch_html =~ "Current Auctions"
    assert autolaunch_html =~ "Past Auctions"
    assert autolaunch_html =~ "rg-regent-theme-autolaunch"
    assert autolaunch_html =~ "curl -fsSL https://autolaunch.sh/skill.md"
  end

  test "removed routes return 404", %{conn: conn} do
    for path <- ["/home", "/names", "/redeem", "/settings", "/agents"] do
      response = get(recycle(conn), path)
      assert response.status == 404
    end
  end
end
