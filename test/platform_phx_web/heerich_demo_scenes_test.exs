defmodule PlatformPhxWeb.HeerichDemoScenesTest do
  use ExUnit.Case, async: true

  alias PlatformPhxWeb.HeerichDemoScenes

  test "demo samples cover baseline, grouped, and split hover cycle variants" do
    samples = HeerichDemoScenes.samples()

    assert length(samples) == 6

    assert sample(samples, "default-primitive").scene
           |> hover_cycle_for_node("demo-default:anchor") == true

    explode_scene = sample(samples, "explode-cluster").scene

    assert hover_cycle_for_node(explode_scene, "demo-explode:crucible")["group"] ==
             "demo-explode-cluster"

    assert hover_cycle_for_node(explode_scene, "demo-explode:market")["group"] ==
             "demo-explode-cluster"

    assert hover_cycle_for_conduit(explode_scene, "demo-explode:edge:1")["group"] ==
             "demo-explode-cluster"

    marker_only_scene = sample(samples, "marker-only").scene
    polygons_only_scene = sample(samples, "polygons-only").scene

    assert hover_cycle_for_node(marker_only_scene, "demo-marker:eye")["includeMarker"] == true
    assert hover_cycle_for_node(marker_only_scene, "demo-marker:eye")["includePolygons"] == false

    assert hover_cycle_for_node(polygons_only_scene, "demo-polygons:risk")["includeMarker"] ==
             false

    assert hover_cycle_for_node(polygons_only_scene, "demo-polygons:risk")["includePolygons"] ==
             true
  end

  test "knob atlas includes the main hover cycle controls and extra easing guidance" do
    rows = HeerichDemoScenes.knob_rows()

    assert {"enabled", _, _} = Enum.find(rows, fn {label, _, _} -> label == "enabled" end)
    assert {"group", _, _} = Enum.find(rows, fn {label, _, _} -> label == "group" end)
    assert {"loopDelayMs", _, _} = Enum.find(rows, fn {label, _, _} -> label == "loopDelayMs" end)

    assert {"includeMarker", _, _} =
             Enum.find(rows, fn {label, _, _} -> label == "includeMarker" end)

    assert {"includePolygons", _, _} =
             Enum.find(rows, fn {label, _, _} -> label == "includePolygons" end)

    assert {"easing", _, _} = Enum.find(rows, fn {label, _, _} -> label == "easing" end)
  end

  defp sample(samples, id) do
    Enum.find(samples, fn sample -> sample.id == id end)
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
