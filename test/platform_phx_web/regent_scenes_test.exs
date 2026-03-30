defmodule PlatformPhxWeb.RegentScenesTest do
  use ExUnit.Case, async: true

  alias PlatformPhxWeb.RegentScenes

  test "unknown focus values fall back to the default section" do
    assert RegentScenes.techtree_focus("unknown") == "observatory"
    assert RegentScenes.autolaunch_focus(nil) == "launch"
    assert RegentScenes.dashboard_focus("wrong") == "session"
  end

  test "autolaunch content replaces board placeholders with counts" do
    content = RegentScenes.autolaunch_content("market", 4, 9)

    assert {"Current board", "4"} in content.table
    assert {"Past board", "9"} in content.table
  end

  test "bridge scenes focus the selected node" do
    techtree_scene = RegentScenes.techtree_bridge("review", 3)
    autolaunch_scene = RegentScenes.autolaunch_bridge(2, 7, "settlement", 5)
    dashboard_scene = RegentScenes.dashboard_header("guardrails", 8)

    assert focused_node_id(techtree_scene) == "techtree:review"
    assert focused_node_id(autolaunch_scene) == "autolaunch:settlement"
    assert focused_node_id(dashboard_scene) == "platform:guardrails"
  end

  test "home scenes expose hover cycle primitives for single nodes and grouped shapes" do
    techtree_scene = RegentScenes.home_scene("techtree")
    autolaunch_scene = RegentScenes.home_scene("autolaunch")
    dashboard_scene = RegentScenes.home_scene("dashboard")

    assert hover_cycle_for_node(techtree_scene, "techtree:root")["mode"] == "collapse"
    assert hover_cycle_for_node(dashboard_scene, "platform:gate")["mode"] == "phase"

    autolaunch_group = hover_cycle_for_node(autolaunch_scene, "autolaunch:crucible")["group"]

    assert autolaunch_group == "autolaunch-home-cluster"

    assert hover_cycle_for_node(autolaunch_scene, "autolaunch:market")["group"] ==
             autolaunch_group

    assert hover_cycle_for_conduit(autolaunch_scene, "autolaunch:edge:1")["group"] ==
             autolaunch_group
  end

  defp focused_node_id(%{"faces" => [%{"nodes" => nodes} | _rest]}) do
    nodes
    |> Enum.find(fn node -> node["status"] == "focused" end)
    |> Map.fetch!("id")
  end

  defp hover_cycle_for_node(%{"faces" => [%{"nodes" => nodes} | _rest]}, id) do
    nodes
    |> Enum.find(fn node -> node["id"] == id end)
    |> Map.fetch!("hoverCycle")
  end

  defp hover_cycle_for_conduit(%{"faces" => [%{"conduits" => conduits} | _rest]}, id) do
    conduits
    |> Enum.find(fn conduit -> conduit["id"] == id end)
    |> Map.fetch!("hoverCycle")
  end
end
