defmodule PlatformPhxWeb.RegentScenes do
  @moduledoc false

  alias Regent.SceneSpec

  @home_scenes %{
    "techtree" => %{
      "app" => "techtree",
      "theme" => "techtree",
      "activeFace" => "entry",
      "sceneVersion" => 1,
      "camera" => %{"type" => "oblique", "angle" => 315, "distance" => 22},
      "faces" => [
        %{
          "id" => "entry",
          "title" => "Dependency observatory",
          "sigil" => "seed",
          "orientation" => "front",
          "nodes" => [
            %{
              "id" => "techtree:root",
              "kind" => "portal",
              "geometry" => "monolith",
              "sigil" => "seed",
              "label" => "Observatory",
              "status" => "focused",
              "position" => [-9, 1, 0],
              "size" => [3, 4, 2],
              "hoverCycle" => %{
                "mode" => "collapse",
                "durationMs" => 960,
                "fill" => "rgba(111, 174, 157, 0.34)",
                "stroke" => "#0a5a70",
                "opacity" => 0.16,
                "scale" => 0.68,
                "translate" => 8,
                "shadow" => "drop-shadow(0 0 14px rgba(111, 174, 157, 0.4))"
              },
              "meta" => %{"navigate" => "/techtree"}
            },
            %{
              "id" => "techtree:review",
              "kind" => "proof",
              "geometry" => "cube",
              "sigil" => "eye",
              "label" => "Review vault",
              "status" => "available",
              "position" => [-1, 5, 0],
              "size" => [2, 2, 2],
              "meta" => %{"navigate" => "/techtree"}
            },
            %{
              "id" => "techtree:archive",
              "kind" => "memory",
              "geometry" => "cube",
              "sigil" => "seal",
              "label" => "Proof archive",
              "status" => "complete",
              "position" => [5, 2, 2],
              "size" => [2, 2, 2],
              "meta" => %{"navigate" => "/techtree"}
            },
            %{
              "id" => "techtree:gate",
              "kind" => "portal",
              "geometry" => "carved_cube",
              "sigil" => "gate",
              "label" => "Bridge",
              "status" => "active",
              "position" => [10, -1, 0],
              "size" => [2, 2, 2],
              "meta" => %{"navigate" => "/techtree"}
            }
          ],
          "conduits" => [
            %{
              "id" => "techtree:edge:1",
              "from" => "techtree:root",
              "to" => "techtree:review",
              "kind" => "dependency",
              "state" => "visible",
              "shape" => "square",
              "radius" => 0.5
            },
            %{
              "id" => "techtree:edge:2",
              "from" => "techtree:review",
              "to" => "techtree:archive",
              "kind" => "dependency",
              "state" => "visible",
              "shape" => "square",
              "radius" => 0.5
            },
            %{
              "id" => "techtree:edge:3",
              "from" => "techtree:archive",
              "to" => "techtree:gate",
              "kind" => "dependency",
              "state" => "flowing",
              "shape" => "square",
              "radius" => 0.45
            }
          ]
        }
      ]
    },
    "autolaunch" => %{
      "app" => "autolaunch",
      "theme" => "autolaunch",
      "activeFace" => "entry",
      "sceneVersion" => 1,
      "camera" => %{"type" => "oblique", "angle" => 315, "distance" => 22},
      "faces" => [
        %{
          "id" => "entry",
          "title" => "Auction forge",
          "sigil" => "fuse",
          "orientation" => "front",
          "nodes" => [
            %{
              "id" => "autolaunch:crucible",
              "kind" => "action",
              "geometry" => "monolith",
              "sigil" => "fuse",
              "label" => "Crucible",
              "status" => "focused",
              "position" => [-9, 1, 0],
              "size" => [3, 4, 2],
              "hoverCycle" => %{
                "group" => "autolaunch-home-cluster",
                "mode" => "explode",
                "durationMs" => 920,
                "fill" => "rgba(126, 217, 87, 0.34)",
                "stroke" => "#4faf63",
                "opacity" => 0.18,
                "scale" => 1.08,
                "translate" => 14,
                "staggerMs" => 24,
                "shadow" => "drop-shadow(0 0 16px rgba(126, 217, 87, 0.36))"
              },
              "meta" => %{"navigate" => "/autolaunch"}
            },
            %{
              "id" => "autolaunch:market",
              "kind" => "token",
              "geometry" => "reliquary",
              "sigil" => "gate",
              "label" => "Live market",
              "status" => "active",
              "position" => [-1, 4, 0],
              "size" => [2, 2, 2],
              "hoverCycle" => %{
                "group" => "autolaunch-home-cluster",
                "mode" => "explode",
                "durationMs" => 920,
                "fill" => "rgba(126, 217, 87, 0.34)",
                "stroke" => "#4faf63",
                "opacity" => 0.18,
                "scale" => 1.08,
                "translate" => 14,
                "staggerMs" => 24,
                "shadow" => "drop-shadow(0 0 16px rgba(126, 217, 87, 0.36))"
              },
              "meta" => %{"navigate" => "/autolaunch"}
            },
            %{
              "id" => "autolaunch:settlement",
              "kind" => "state",
              "geometry" => "cube",
              "sigil" => "seal",
              "label" => "Settlement",
              "status" => "complete",
              "position" => [5, 1, 2],
              "size" => [2, 2, 2],
              "meta" => %{"navigate" => "/autolaunch"}
            },
            %{
              "id" => "autolaunch:risk",
              "kind" => "state",
              "geometry" => "ghost",
              "sigil" => "wedge",
              "label" => "Risk rail",
              "status" => "available",
              "position" => [10, -2, 0],
              "size" => [2, 2, 2],
              "opaque" => false,
              "meta" => %{"navigate" => "/autolaunch"}
            }
          ],
          "conduits" => [
            %{
              "id" => "autolaunch:edge:1",
              "from" => "autolaunch:crucible",
              "to" => "autolaunch:market",
              "kind" => "launch_phase",
              "state" => "flowing",
              "shape" => "rounded",
              "radius" => 0.5,
              "hoverCycle" => %{
                "group" => "autolaunch-home-cluster",
                "mode" => "explode",
                "durationMs" => 920,
                "fill" => "rgba(126, 217, 87, 0.26)",
                "stroke" => "#4faf63",
                "opacity" => 0.22,
                "scale" => 1.04,
                "translate" => 12,
                "staggerMs" => 18,
                "includeMarker" => false,
                "shadow" => "drop-shadow(0 0 14px rgba(126, 217, 87, 0.3))"
              }
            },
            %{
              "id" => "autolaunch:edge:2",
              "from" => "autolaunch:market",
              "to" => "autolaunch:settlement",
              "kind" => "launch_phase",
              "state" => "visible",
              "shape" => "rounded",
              "radius" => 0.5
            },
            %{
              "id" => "autolaunch:edge:3",
              "from" => "autolaunch:settlement",
              "to" => "autolaunch:risk",
              "kind" => "launch_phase",
              "state" => "visible",
              "shape" => "rounded",
              "radius" => 0.45
            }
          ]
        }
      ]
    },
    "dashboard" => %{
      "app" => "platform",
      "theme" => "platform",
      "activeFace" => "entry",
      "sceneVersion" => 1,
      "camera" => %{"type" => "oblique", "angle" => 315, "distance" => 22},
      "faces" => [
        %{
          "id" => "entry",
          "title" => "Ops citadel",
          "sigil" => "gate",
          "orientation" => "front",
          "nodes" => [
            %{
              "id" => "platform:gate",
              "kind" => "portal",
              "geometry" => "monolith",
              "sigil" => "gate",
              "label" => "Session gate",
              "status" => "focused",
              "position" => [-9, 1, 0],
              "size" => [3, 4, 2],
              "hoverCycle" => %{
                "mode" => "phase",
                "durationMs" => 1020,
                "fill" => "rgba(212, 167, 86, 0.24)",
                "stroke" => "#7a5e24",
                "opacity" => 0.28,
                "scale" => 0.9,
                "translate" => 10,
                "shadow" => "drop-shadow(0 0 14px rgba(212, 167, 86, 0.34))"
              },
              "meta" => %{"navigate" => "/services"}
            },
            %{
              "id" => "platform:inspect",
              "kind" => "state",
              "geometry" => "cube",
              "sigil" => "eye",
              "label" => "Redeem rail",
              "status" => "active",
              "position" => [-1, 4, 0],
              "size" => [2, 2, 2],
              "meta" => %{"navigate" => "/services"}
            },
            %{
              "id" => "platform:seal",
              "kind" => "state",
              "geometry" => "cube",
              "sigil" => "seal",
              "label" => "Name claim",
              "status" => "complete",
              "position" => [5, 1, 2],
              "size" => [2, 2, 2],
              "meta" => %{"navigate" => "/services"}
            },
            %{
              "id" => "platform:guardrail",
              "kind" => "state",
              "geometry" => "ghost",
              "sigil" => "wedge",
              "label" => "Guardrails",
              "status" => "available",
              "position" => [10, -2, 0],
              "size" => [2, 2, 2],
              "opaque" => false,
              "meta" => %{"navigate" => "/services"}
            }
          ],
          "conduits" => [
            %{
              "id" => "platform:edge:1",
              "from" => "platform:gate",
              "to" => "platform:inspect",
              "kind" => "command_stream",
              "state" => "visible",
              "shape" => "square",
              "radius" => 0.48
            },
            %{
              "id" => "platform:edge:2",
              "from" => "platform:inspect",
              "to" => "platform:seal",
              "kind" => "command_stream",
              "state" => "visible",
              "shape" => "square",
              "radius" => 0.48
            },
            %{
              "id" => "platform:edge:3",
              "from" => "platform:seal",
              "to" => "platform:guardrail",
              "kind" => "command_stream",
              "state" => "sealed",
              "shape" => "square",
              "radius" => 0.42
            }
          ]
        }
      ]
    }
  }

  @techtree_sections %{
    "observatory" => %{
      title: "Dependency observatory",
      subtitle: "Seed-first bridge",
      summary:
        "Techtree stays the research loop. The bridge page keeps the public purpose, the reuse pattern, and the handoff path readable before you move to the upcoming external surface.",
      tags: ["Public preview", "Research-first", "Bridge page"],
      table: [
        {"Best for", "Research loops and reusable work"},
        {"Surface tone", "Parchment, cobalt, brass"},
        {"External route", "techtree.sh"}
      ]
    },
    "review" => %{
      title: "Review vault",
      subtitle: "Human-readable judgment",
      summary:
        "The voxel surface points toward review, but the actual human judgment still happens in explicit text, comments, and linked evidence. This bridge page explains that split clearly.",
      tags: ["Eye sigil", "Plain-English review", "No sigil-only approval"],
      table: [
        {"Chamber role", "Summarize what this route is handing off"},
        {"Ledger role", "Keep the operator rules explicit"},
        {"Workflow", "Inspect here, judge there"}
      ]
    },
    "proof" => %{
      title: "Proof archive",
      subtitle: "Seal what compounds",
      summary:
        "The bridge emphasizes reusable artifacts, published skills, and visible progress. The scene uses sealed nodes to show that Techtree compounds durable work instead of ephemeral sessions.",
      tags: ["Published skills", "Visible progress", "Compounding work"],
      table: [
        {"Artifacts", "Skills, runs, linked proofs"},
        {"Node style", "Structural and archival"},
        {"Primary action", "Preview the research surface"}
      ]
    },
    "gate" => %{
      title: "Open Techtree",
      subtitle: "Explicit handoff",
      summary:
        "This route is intentionally a bridge, not a mirror. The upcoming external surface is meant to own the full research graph and benchmark workflow, and the outbound links stay explicit.",
      tags: ["External handoff", "No cloned graph", "Bridge only"],
      table: [
        {"Homepage role", "Chooser and explainer"},
        {"Twin route role", "Bridge and context"},
        {"Outbound target", "techtree.sh"}
      ]
    }
  }

  @autolaunch_sections %{
    "launch" => %{
      title: "Auction forge",
      subtitle: "Fuse-first launch control",
      summary:
        "Autolaunch owns the hotter market workflow. This bridge page keeps the preview board visible, shows what is current versus settled, and points people toward the upcoming auction surface.",
      tags: ["Market-first", "Fuse conduits", "Bridge page"],
      table: [
        {"Best for", "Launches, bidding, settlement"},
        {"Surface tone", "Verdigris, copper, ember"},
        {"External route", "autolaunch.sh"}
      ]
    },
    "market" => %{
      title: "Preview market board",
      subtitle: "Readable velocity",
      summary:
        "The scene keeps urgency symbolic, but the bridge route still explains current and past market state in plain English. Financial actions remain explicit and outbound.",
      tags: ["Current board", "Past board", "Explicit links"],
      table: [
        {"Current board", "__CURRENT__"},
        {"Past board", "__PAST__"},
        {"Operator move", "Preview the market"}
      ]
    },
    "settlement" => %{
      title: "Settlement rail",
      subtitle: "Seal what closed",
      summary:
        "Closed or claimable auctions read as sealed states. The page preserves the current and past split while keeping settlement language plain instead of hiding it behind symbols.",
      tags: ["Claim-aware", "Closed states", "Operator-readable"],
      table: [
        {"Current meaning", "Open or still settling"},
        {"Past meaning", "Closed and already moved"},
        {"Rule", "Money actions stay explicit"}
      ]
    },
    "risk" => %{
      title: "Risk rail",
      subtitle: "Wedge for caution",
      summary:
        "The wedge appears where timing and market state matter, but it does not replace the actual financial explanation. The bridge page stays legible first and symbolic second.",
      tags: ["Time-sensitive", "No hidden risk", "Bridge only"],
      table: [
        {"Urgency tone", "Hotter than Techtree"},
        {"Scene role", "Orientation and status"},
        {"Action surface", "autolaunch.sh"}
      ]
    }
  }

  @dashboard_sections %{
    "session" => %{
      title: "Ops citadel",
      subtitle: "Platform shell",
      summary:
        "The dashboard keeps the operator shell quieter than the product twins. It shows the session, the retained onchain flows, and the guardrails, but the actual work stays in readable panels and the React mount below.",
      tags: ["Operator-grade", "Quiet shell", "Phoenix-owned"],
      table: [
        {"Current route", "/services"},
        {"Primary flows", "Redeem and name claim"},
        {"Interaction rule", "Readable first"}
      ]
    },
    "redeem" => %{
      title: "Redeem rail",
      subtitle: "Inspect before action",
      summary:
        "The scene summarizes the redeem rail, but it does not own the transaction flow. The actual wallet-heavy work remains in the dashboard application below.",
      tags: ["Wallet-heavy", "Readable controls", "Scene as summary"],
      table: [
        {"Order", "Redeem first"},
        {"Renderer", "React dashboard root"},
        {"Sigil role", "Status, not the transaction UI"}
      ]
    },
    "names" => %{
      title: "Name claim rail",
      subtitle: "Seal the retained follow-up",
      summary:
        "Name claim follows redeem inside the same wallet session. The scene marks that ordering, while the explicit forms and confirmations stay in the mounted dashboard app.",
      tags: ["Same session", "Second step", "Explicit forms"],
      table: [
        {"Order", "Name claim second"},
        {"Flow ownership", "React dashboard root"},
        {"Platform tone", "Calmer than market routes"}
      ]
    },
    "guardrails" => %{
      title: "Operator guardrails",
      subtitle: "Wedge for limits",
      summary:
        "The platform theme uses the wedge as a guardrail rather than an aggressive warning. It signals limits and control boundaries without turning the dashboard into a high-drama surface.",
      tags: ["Quieter warning", "Control boundaries", "Ops citadel"],
      table: [
        {"Theme", "Paper, ink, slate, muted gold"},
        {"Scene role", "Header landmark only"},
        {"Cursor", "Normal inside dashboard"}
      ]
    }
  }

  @home_logo_style %{
    "default" => %{"fill" => "#f5ecd7", "stroke" => "#d4c2a0"},
    "top" => %{"fill" => "#fff8e9"},
    "left" => %{"fill" => "#e7d9ba"},
    "right" => %{"fill" => "#efe1c4"},
    "bottom" => %{"fill" => "#d8c6a1"}
  }

  @dashboard_logo_hover %{
    "mode" => "phase",
    "durationMs" => 1020,
    "fill" => "rgba(9, 75, 117, 0.24)",
    "stroke" => "#094b75",
    "opacity" => 0.28,
    "scale" => 0.9,
    "translate" => 10,
    "shadow" => "drop-shadow(0 0 14px rgba(9, 75, 117, 0.32))"
  }

  def home_scene("dashboard"),
    do:
      home_logo_scene(
        "platform",
        "platform",
        "Ops citadel",
        "gate",
        "platform:home-logo",
        "Canonical Regent mark",
        "Open dashboard",
        "/services",
        regent_split_home_commands("platform:home-logo"),
        20
      )

  def home_scene("techtree"),
    do:
      home_logo_scene(
        "techtree",
        "techtree",
        "Dependency observatory",
        "seed",
        "techtree:home-logo",
        "Canonical Techtree mark",
        "Open Techtree",
        "/techtree",
        techtree_ledger_home_commands("techtree:home-logo"),
        20
      )

  def home_scene("autolaunch"),
    do:
      home_logo_scene(
        "autolaunch",
        "autolaunch",
        "Auction forge",
        "fuse",
        "autolaunch:home-logo",
        "Canonical Autolaunch mark",
        "Open Autolaunch",
        "/autolaunch",
        autolaunch_claim_home_commands("autolaunch:home-logo"),
        20
      )

  def home_scene(card_id), do: @home_scenes |> Map.fetch!(card_id) |> scene_from_entries()

  def overview_human_scene do
    overview_logo_scene(
      "Human workstation",
      "gate",
      "platform:overview-human",
      "Open laptop landmark",
      overview_human_commands("platform:overview-human"),
      18
    )
  end

  def overview_agent_scene do
    overview_logo_scene(
      "Agent operator",
      "seal",
      "platform:overview-agent",
      "Robot landmark",
      overview_agent_commands("platform:overview-agent"),
      18
    )
  end

  def techtree_focus(focus),
    do: normalize_focus(focus, Map.keys(@techtree_sections), "observatory")

  def autolaunch_focus(focus),
    do: normalize_focus(focus, Map.keys(@autolaunch_sections), "launch")

  def dashboard_focus(focus), do: normalize_focus(focus, Map.keys(@dashboard_sections), "session")

  def techtree_content(focus), do: Map.fetch!(@techtree_sections, techtree_focus(focus))

  def autolaunch_content(focus, current_count, past_count) do
    section = Map.fetch!(@autolaunch_sections, autolaunch_focus(focus))

    table =
      Enum.map(section.table, fn
        {"Current board", "__CURRENT__"} -> {"Current board", Integer.to_string(current_count)}
        {"Past board", "__PAST__"} -> {"Past board", Integer.to_string(past_count)}
        entry -> entry
      end)

    %{section | table: table}
  end

  def dashboard_content(focus), do: Map.fetch!(@dashboard_sections, dashboard_focus(focus))

  defp home_logo_scene(
         app,
         theme,
         title,
         sigil,
         target_id,
         label,
         action_label,
         path,
         commands,
         distance
       ) do
    marker =
      SceneSpec.marker(target_id,
        label: label,
        action_label: action_label,
        sigil: sigil,
        kind: "portal",
        status: "focused",
        intent: "navigate",
        group_role: "landmark",
        command_id: "#{target_id}:0",
        meta: %{"navigate" => path}
      )

    face = SceneSpec.face("entry", title, sigil, commands, [marker], orientation: "front")

    SceneSpec.scene(app, theme, "entry", face, distance: distance, scene_version: 2)
  end

  defp overview_logo_scene(title, sigil, target_id, label, commands, distance) do
    marker =
      SceneSpec.marker(target_id,
        label: label,
        sigil: sigil,
        kind: "landmark",
        status: "focused",
        intent: "status_only",
        group_role: "landmark",
        command_id: "#{target_id}:0"
      )

    face = SceneSpec.face("entry", title, sigil, commands, [marker], orientation: "front")

    SceneSpec.scene("platform", "platform", "entry", face,
      distance: distance,
      scene_version: 2
    )
  end

  defp regent_split_home_commands(target_id) do
    %{outer_size: 11, inner_size: 6, inner_offset_x: 2, inner_offset_y: 3}
    |> regent_elbow_cells(
      outer_thickness: 2,
      outer_crook_cells: [{2, 2}, {2, 3}, {3, 3}],
      inner_crook_cells: [{1, 1}]
    )
    |> reflect_diagonal_cells()
    |> place_quadrant_cells(2)
    |> rotate_quadrants()
    |> centered_cells()
    |> restore_top_left_voxel()
    |> voxel_boxes(0, 2)
    |> build_box_commands(target_id, [0.705, 0.705, 0.66], nil)
  end

  defp techtree_ledger_home_commands(target_id) do
    alpha = techtree_t_cells({0, 0}, 4, 4, 5)
    beta = shift_cells(alpha, 5, 6)
    [alpha, beta] = centered_layer_sets([alpha, beta])
    alpha = restore_top_left_voxel(alpha)

    (voxel_boxes(alpha, 0, 2) ++ voxel_boxes(beta, 2, 2))
    |> build_box_commands(target_id, [0.95, 0.95, 0.92], nil)
  end

  defp autolaunch_claim_home_commands(target_id) do
    [
      vertical_cells(0, 0, 4),
      horizontal_cells(4, 0, 5),
      rect_cells(2, 2, 2, 1),
      rect_cells(4, 1, 2, 1),
      rect_cells(6, 0, 2, 1)
    ]
    |> List.flatten()
    |> uniq_cells()
    |> centered_cells()
    |> voxel_boxes(0, 3)
    |> build_box_commands(target_id, [0.83, 0.83, 0.88], nil)
  end

  defp overview_human_commands(target_id) do
    screen =
      horizontal_cells(0, 2, 8) ++
        vertical_cells(2, 1, 5) ++
        vertical_cells(8, 1, 5) ++
        horizontal_cells(6, 3, 7)

    deck =
      rect_cells(0, 8, 11, 1) ++
        rect_cells(1, 9, 9, 1) ++
        rect_cells(3, 10, 5, 1)

    hinge = rect_cells(4, 7, 3, 1)
    keyboard = rect_cells(3, 9, 5, 1)

    [screen, hinge, deck, keyboard] = centered_layer_sets([screen, hinge, deck, keyboard])

    (voxel_boxes(screen, 2, 3) ++
       voxel_boxes(hinge, 1, 2) ++
       voxel_boxes(deck, 0, 2) ++
       voxel_boxes(keyboard, 0, 1))
    |> build_box_commands(target_id, [0.8, 0.8, 0.76], @dashboard_logo_hover)
  end

  defp overview_agent_commands(target_id) do
    antenna = horizontal_cells(0, 5, 5) ++ vertical_cells(5, -2, -1)

    head =
      horizontal_cells(1, 2, 8) ++
        vertical_cells(2, 2, 8) ++
        vertical_cells(8, 2, 8) ++
        horizontal_cells(8, 3, 7) ++
        rect_cells(1, 3, 1, 3) ++
        rect_cells(9, 3, 1, 3)

    brow = horizontal_cells(3, 3, 7)
    eyes = rect_cells(3, 4, 1, 2) ++ rect_cells(7, 4, 1, 2)
    mouth = horizontal_cells(7, 4, 6)

    [antenna, head, brow, eyes, mouth] =
      centered_layer_sets([antenna, head, brow, eyes, mouth])

    (voxel_boxes(antenna, 2, 2) ++
       voxel_boxes(head, 0, 3) ++
       voxel_boxes(brow, 1, 2) ++
       voxel_boxes(eyes, 1, 2) ++
       voxel_boxes(mouth, 1, 2))
    |> build_box_commands(target_id, [0.8, 0.8, 0.76], @dashboard_logo_hover)
  end

  defp build_box_commands(boxes, target_id, scale, hover_cycle) do
    Enum.with_index(boxes)
    |> Enum.map(fn {{position, size}, index} ->
      SceneSpec.add_box(
        "#{target_id}:#{index}",
        position,
        size,
        style: @home_logo_style,
        target_id: target_id,
        scale: scale,
        scale_origin: [0.5, 0.5, 0.5],
        hover_cycle: hover_cycle
      )
    end)
  end

  defp voxel_boxes(cells, z, depth) do
    Enum.map(cells, fn {x, y} -> {[x, y, z], [1, 1, depth]} end)
  end

  defp centered_layer_sets(layers) do
    all_cells = Enum.flat_map(layers, & &1)
    {offset_x, offset_y} = center_offsets(all_cells)

    Enum.map(layers, fn layer ->
      Enum.map(layer, fn {x, y} -> {x - offset_x, y - offset_y} end)
    end)
  end

  defp centered_cells(cells) do
    {offset_x, offset_y} = center_offsets(cells)
    Enum.map(cells, fn {x, y} -> {x - offset_x, y - offset_y} end)
  end

  defp center_offsets(cells) do
    xs = Enum.map(cells, &elem(&1, 0))
    ys = Enum.map(cells, &elem(&1, 1))
    {div(Enum.min(xs) + Enum.max(xs), 2), div(Enum.min(ys) + Enum.max(ys), 2)}
  end

  defp rotate_quadrants(cells) do
    cells
    |> Enum.flat_map(fn cell ->
      [
        rotate_quarter_turns(cell, 0),
        rotate_quarter_turns(cell, 1),
        rotate_quarter_turns(cell, 2),
        rotate_quarter_turns(cell, 3)
      ]
    end)
    |> uniq_cells()
  end

  defp rotate_quarter_turns({x, y}, turns) do
    normalized_turns = Integer.mod(turns, 4)

    if normalized_turns == 0 do
      {x, y}
    else
      Enum.reduce(1..normalized_turns, {x, y}, fn _, {cx, cy} ->
        {-cy, cx}
      end)
    end
  end

  defp place_quadrant_cells(cells, gap) do
    max_y = cells |> Enum.map(&elem(&1, 1)) |> Enum.max()
    Enum.map(cells, fn {x, y} -> {x + gap, y - (max_y + gap)} end)
  end

  defp regent_elbow_cells(config, opts) do
    outer =
      diagonal_symmetric_elbow_cells(
        config.outer_size,
        Keyword.get(opts, :outer_thickness, 1),
        Keyword.get(opts, :outer_crook_cells, [])
      )
      |> flip_horizontal_cells(config.outer_size)

    inner =
      diagonal_symmetric_elbow_cells(
        config.inner_size,
        Keyword.get(opts, :inner_thickness, 1),
        Keyword.get(opts, :inner_crook_cells, [])
      )
      |> flip_vertical_cells(config.inner_size)
      |> shift_cells(config.inner_offset_x, config.inner_offset_y)

    uniq_cells(outer ++ inner)
  end

  defp diagonal_symmetric_elbow_cells(size, thickness, crook_cells) do
    seed =
      0..(thickness - 1)
      |> Enum.flat_map(fn row_index -> horizontal_cells(row_index, thickness, size - 1) end)

    uniq_cells(
      seed ++
        Enum.map(seed, fn {x, y} -> {y, x} end) ++
        crook_cells ++ Enum.map(crook_cells, fn {x, y} -> {y, x} end)
    )
  end

  defp techtree_t_cells({base_x, base_y}, left_arm, right_arm, stem) do
    mid_y = base_y + 1
    center_x = base_x + 1

    uniq_cells(
      node_block_cells(base_x, base_y, 3) ++
        horizontal_cells(mid_y, base_x - left_arm, base_x - 1) ++
        horizontal_cells(mid_y, base_x + 3, base_x + 2 + right_arm) ++
        vertical_cells(center_x, base_y + 3, base_y + 2 + stem)
    )
  end

  defp node_block_cells(base_x, base_y, size) do
    for x <- base_x..(base_x + size - 1), y <- base_y..(base_y + size - 1), do: {x, y}
  end

  defp shift_cells(cells, delta_x, delta_y) do
    Enum.map(cells, fn {x, y} -> {x + delta_x, y + delta_y} end)
  end

  defp flip_horizontal_cells(cells, size) do
    Enum.map(cells, fn {x, y} -> {size - 1 - x, y} end)
  end

  defp flip_vertical_cells(cells, size) do
    Enum.map(cells, fn {x, y} -> {x, size - 1 - y} end)
  end

  defp reflect_diagonal_cells(cells) do
    Enum.map(cells, fn {x, y} -> {y, x} end)
  end

  defp horizontal_cells(y, start_x, end_x), do: Enum.map(start_x..end_x, &{&1, y})
  defp vertical_cells(x, start_y, end_y), do: Enum.map(start_y..end_y, &{x, &1})

  defp rect_cells(x, y, width, height) do
    for px <- x..(x + width - 1), py <- y..(y + height - 1), do: {px, py}
  end

  defp uniq_cells(cells), do: cells |> Enum.uniq() |> Enum.sort()

  defp restore_top_left_voxel(cells) do
    top_y =
      cells
      |> Enum.map(&elem(&1, 1))
      |> Enum.min()

    left_x =
      cells
      |> Enum.filter(&(elem(&1, 1) == top_y))
      |> Enum.map(&elem(&1, 0))
      |> Enum.min()

    uniq_cells([{left_x - 1, top_y} | cells])
  end

  def techtree_bridge(focus, scene_version) do
    focus = techtree_focus(focus)

    base_scene(
      "techtree",
      "techtree",
      "bridge",
      "seed",
      [
        focusable_node(
          "techtree:observatory",
          "portal",
          "monolith",
          "seed",
          "Observatory",
          focus,
          "observatory",
          [-10, 1, 0],
          [3, 4, 2],
          "active"
        ),
        focusable_node(
          "techtree:review",
          "proof",
          "cube",
          "eye",
          "Review vault",
          focus,
          "review",
          [-2, 5, 0],
          [2, 2, 2],
          "available"
        ),
        focusable_node(
          "techtree:proof",
          "memory",
          "cube",
          "seal",
          "Proof archive",
          focus,
          "proof",
          [5, 2, 2],
          [2, 2, 2],
          "complete"
        ),
        focusable_node(
          "techtree:gate",
          "portal",
          "carved_cube",
          "gate",
          "External gate",
          focus,
          "gate",
          [11, -1, 0],
          [2, 2, 2],
          "active"
        )
      ],
      [
        conduit(
          "techtree:bridge:1",
          "techtree:observatory",
          "techtree:review",
          "dependency",
          "visible",
          "square",
          0.5
        ),
        conduit(
          "techtree:bridge:2",
          "techtree:review",
          "techtree:proof",
          "dependency",
          "visible",
          "square",
          0.5
        ),
        conduit(
          "techtree:bridge:3",
          "techtree:proof",
          "techtree:gate",
          "dependency",
          "flowing",
          "square",
          0.45
        )
      ],
      26,
      scene_version
    )
  end

  def autolaunch_bridge(current_count, past_count, focus, scene_version) do
    focus = autolaunch_focus(focus)

    base_scene(
      "autolaunch",
      "autolaunch",
      "bridge",
      "fuse",
      [
        focusable_node(
          "autolaunch:launch",
          "action",
          "monolith",
          "fuse",
          "Crucible",
          focus,
          "launch",
          [-10, 1, 0],
          [3, 4, 2],
          "active"
        ),
        focusable_node(
          "autolaunch:market",
          "token",
          "reliquary",
          "gate",
          "Board #{current_count}",
          focus,
          "market",
          [-2, 5, 0],
          [2, 2, 2],
          "active"
        ),
        focusable_node(
          "autolaunch:settlement",
          "state",
          "cube",
          "seal",
          "Settled #{past_count}",
          focus,
          "settlement",
          [5, 2, 2],
          [2, 2, 2],
          "complete"
        ),
        focusable_node(
          "autolaunch:risk",
          "state",
          "ghost",
          "wedge",
          "Risk rail",
          focus,
          "risk",
          [11, -1, 0],
          [2, 2, 2],
          "available",
          false
        )
      ],
      [
        conduit(
          "autolaunch:bridge:1",
          "autolaunch:launch",
          "autolaunch:market",
          "launch_phase",
          "flowing",
          "rounded",
          0.5
        ),
        conduit(
          "autolaunch:bridge:2",
          "autolaunch:market",
          "autolaunch:settlement",
          "launch_phase",
          "visible",
          "rounded",
          0.5
        ),
        conduit(
          "autolaunch:bridge:3",
          "autolaunch:settlement",
          "autolaunch:risk",
          "launch_phase",
          "visible",
          "rounded",
          0.45
        )
      ],
      25,
      scene_version
    )
  end

  def dashboard_header(focus, scene_version) do
    focus = dashboard_focus(focus)

    base_scene(
      "platform",
      "platform",
      "header",
      "gate",
      [
        focusable_node(
          "platform:session",
          "portal",
          "monolith",
          "gate",
          "Session gate",
          focus,
          "session",
          [-10, 1, 0],
          [3, 4, 2],
          "active"
        ),
        focusable_node(
          "platform:redeem",
          "state",
          "cube",
          "eye",
          "Redeem rail",
          focus,
          "redeem",
          [-2, 5, 0],
          [2, 2, 2],
          "active"
        ),
        focusable_node(
          "platform:names",
          "state",
          "cube",
          "seal",
          "Name claim",
          focus,
          "names",
          [5, 2, 2],
          [2, 2, 2],
          "complete"
        ),
        focusable_node(
          "platform:guardrails",
          "state",
          "ghost",
          "wedge",
          "Guardrails",
          focus,
          "guardrails",
          [11, -1, 0],
          [2, 2, 2],
          "available",
          false
        )
      ],
      [
        conduit(
          "platform:header:1",
          "platform:session",
          "platform:redeem",
          "command_stream",
          "visible",
          "square",
          0.48
        ),
        conduit(
          "platform:header:2",
          "platform:redeem",
          "platform:names",
          "command_stream",
          "visible",
          "square",
          0.48
        ),
        conduit(
          "platform:header:3",
          "platform:names",
          "platform:guardrails",
          "command_stream",
          "sealed",
          "square",
          0.42
        )
      ],
      24,
      scene_version
    )
  end

  defp base_scene(app, theme, face_id, sigil, nodes, conduits, distance, scene_version) do
    {commands, markers} = assemble_face(nodes, conduits)

    face =
      SceneSpec.face(face_id, face_id, sigil, commands, markers, orientation: "front")

    SceneSpec.scene(app, theme, face_id, face,
      distance: distance,
      scene_version: scene_version
    )
  end

  defp focusable_node(
         id,
         kind,
         geometry,
         sigil,
         label,
         active_focus,
         focus_key,
         position,
         size,
         default_status,
         opaque \\ true
       ) do
    %{
      "id" => id,
      "kind" => kind,
      "geometry" => geometry,
      "sigil" => sigil,
      "label" => label,
      "actionLabel" => "Focus #{label}",
      "intent" => "scene_action",
      "groupRole" => "landmark",
      "status" => if(active_focus == focus_key, do: "focused", else: default_status),
      "position" => position,
      "size" => size,
      "opaque" => opaque,
      "meta" => %{"focus" => focus_key}
    }
  end

  defp conduit(id, from, to, kind, state, shape, radius) do
    %{
      "id" => id,
      "from" => from,
      "to" => to,
      "kind" => kind,
      "state" => state,
      "shape" => shape,
      "radius" => radius
    }
  end

  defp normalize_focus(focus, valid_keys, default) do
    if focus in valid_keys, do: focus, else: default
  end

  defp scene_from_entries(scene) do
    [face] = Map.fetch!(scene, "faces")
    {commands, markers} = assemble_face(Map.get(face, "nodes", []), Map.get(face, "conduits", []))

    raw_face =
      SceneSpec.face(
        Map.fetch!(face, "id"),
        Map.get(face, "title", Map.fetch!(face, "id")),
        Map.get(face, "sigil", "gate"),
        commands,
        markers,
        orientation: Map.get(face, "orientation", "front"),
        landmark_target_id: Map.get(face, "landmarkTargetId"),
        meta: Map.get(face, "meta")
      )

    SceneSpec.scene(
      Map.get(scene, "app", "platform"),
      Map.get(scene, "theme", "platform"),
      Map.get(scene, "activeFace", Map.fetch!(face, "id")),
      raw_face,
      distance: get_in(scene, ["camera", "distance"]) || 24,
      scene_version: Map.get(scene, "sceneVersion", 1),
      meta: Map.get(scene, "meta")
    )
  end

  defp assemble_face(nodes, conduits) do
    nodes_by_id = Map.new(nodes, &{&1["id"], &1})
    entries = Enum.map(nodes, &node_entry/1)

    commands =
      Enum.flat_map(entries, & &1.commands) ++
        Enum.flat_map(conduits, &conduit_commands(&1, nodes_by_id))

    markers = Enum.map(entries, & &1.marker)
    {commands, markers}
  end

  defp node_entry(node) do
    node_id = node["id"]
    status = node["status"] || "available"
    position = node["position"] || [0, 0, 0]
    size = node["size"] || [1, 1, 1]
    geometry = node["geometry"] || "cube"
    target_id = node_id
    hover_cycle = Map.get(node, "hoverCycle")
    meta = Map.get(node, "meta", %{})
    command_id = node["commandId"] || "#{node_id}:body"
    custom_commands = Map.get(node, "commands")
    intent = node["intent"] || default_platform_intent(node)
    action_label = node["actionLabel"] || default_platform_action_label(node)
    group_role = node["groupRole"] || default_platform_group_role(node)

    marker =
      SceneSpec.marker(target_id,
        label: node["label"] || node_id,
        action_label: action_label,
        sigil: node["sigil"],
        kind: node["kind"],
        status: status,
        intent: intent,
        back_target_id: node["backTargetId"],
        history_key: node["historyKey"],
        group_role: group_role,
        click_tone: node["clickTone"],
        meta: meta,
        command_id: command_id
      )

    intent_style = SceneSpec.intent_style(SceneSpec.node_style(status), intent)

    commands =
      if is_list(custom_commands) do
        custom_commands
      else
        case geometry do
          "socket" ->
            [
              SceneSpec.add_sphere(
                command_id,
                SceneSpec.sphere_center(position, size),
                SceneSpec.sphere_radius(size),
                style: intent_style,
                hover_cycle: hover_cycle,
                target_id: target_id,
                scale: node["scale"] || SceneSpec.socket_scale(size, status),
                scale_origin: node["scaleOrigin"] || [0.5, 1, 0.5]
              )
            ]

          "carved_cube" ->
            [
              SceneSpec.add_box(
                command_id,
                position,
                size,
                style: intent_style,
                hover_cycle: hover_cycle,
                target_id: target_id
              ),
              SceneSpec.remove_box(
                "#{node_id}:carve",
                SceneSpec.inset_position(position),
                SceneSpec.inset_size(size),
                style: SceneSpec.carved_wall_style(status),
                target_id: target_id
              )
            ]

          "ghost" ->
            [
              SceneSpec.add_box(
                command_id,
                position,
                size,
                style: SceneSpec.ghost_style(),
                opaque: false,
                hover_cycle: hover_cycle,
                target_id: target_id
              )
            ]

          "reliquary" ->
            [
              SceneSpec.add_box(
                command_id,
                position,
                size,
                style: intent_style,
                hover_cycle: hover_cycle,
                target_id: target_id,
                scale: node["scale"] || [0.88, 0.92, 0.88],
                scale_origin: node["scaleOrigin"] || [0.5, 1, 0.5]
              )
            ]

          "monolith" ->
            [
              SceneSpec.add_box(
                command_id,
                position,
                size,
                style: intent_style,
                hover_cycle: hover_cycle,
                target_id: target_id,
                scale: node["scale"] || [0.9, 1, 0.9],
                scale_origin: node["scaleOrigin"] || [0.5, 1, 0.5]
              )
            ]

          _ ->
            [
              SceneSpec.add_box(
                command_id,
                position,
                size,
                style: intent_style,
                opaque: Map.get(node, "opaque"),
                hover_cycle: hover_cycle,
                target_id: target_id,
                scale: SceneSpec.default_scale(node, status),
                scale_origin: SceneSpec.default_scale_origin(node, status)
              )
            ]
        end
      end

    %{commands: commands, marker: marker}
  end

  defp conduit_commands(conduit, nodes_by_id) do
    custom_commands = Map.get(conduit, "commands")

    cond do
      is_list(custom_commands) ->
        custom_commands

      true ->
        with from_node when is_map(from_node) <- Map.get(nodes_by_id, conduit["from"]),
             to_node when is_map(to_node) <- Map.get(nodes_by_id, conduit["to"]) do
          base =
            SceneSpec.add_line(
              "#{conduit["id"]}:line",
              SceneSpec.anchor(Map.fetch!(from_node, "position"), Map.fetch!(from_node, "size")),
              SceneSpec.anchor(Map.fetch!(to_node, "position"), Map.fetch!(to_node, "size")),
              radius: conduit["radius"] || 0.75,
              shape: conduit["shape"] || "rounded",
              style: SceneSpec.conduit_style(conduit["state"] || "visible"),
              hover_cycle: conduit["hoverCycle"]
            )

          waypoints =
            conduit
            |> Map.get("waypoints", [])
            |> Enum.with_index()
            |> Enum.map(fn {point, index} ->
              SceneSpec.add_sphere(
                "#{conduit["id"]}:waypoint:#{index}",
                point,
                0.6,
                style: SceneSpec.conduit_style(conduit["state"] || "visible"),
                hover_cycle: conduit["hoverCycle"]
              )
            end)

          [base | waypoints]
        else
          _ -> []
        end
    end
  end

  defp default_platform_intent(node) do
    meta = Map.get(node, "meta", %{})
    if is_binary(meta["navigate"]), do: "navigate", else: "scene_action"
  end

  defp default_platform_action_label(node) do
    meta = Map.get(node, "meta", %{})

    cond do
      is_binary(meta["navigate"]) -> "Open route"
      is_binary(node["label"]) -> "Focus #{node["label"]}"
      true -> nil
    end
  end

  defp default_platform_group_role(node) do
    case node["geometry"] do
      geometry when geometry in ["monolith", "reliquary", "carved_cube"] -> "landmark"
      _ -> nil
    end
  end
end
