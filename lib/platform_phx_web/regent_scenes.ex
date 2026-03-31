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
                "fill" => "rgba(212, 177, 91, 0.3)",
                "stroke" => "#6f5314",
                "opacity" => 0.16,
                "scale" => 0.68,
                "translate" => 8,
                "shadow" => "drop-shadow(0 0 14px rgba(212, 177, 91, 0.42))"
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
                "fill" => "rgba(217, 119, 6, 0.3)",
                "stroke" => "#8f3d16",
                "opacity" => 0.18,
                "scale" => 1.08,
                "translate" => 14,
                "staggerMs" => 24,
                "shadow" => "drop-shadow(0 0 16px rgba(217, 119, 6, 0.36))"
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
                "fill" => "rgba(217, 119, 6, 0.3)",
                "stroke" => "#8f3d16",
                "opacity" => 0.18,
                "scale" => 1.08,
                "translate" => 14,
                "staggerMs" => 24,
                "shadow" => "drop-shadow(0 0 16px rgba(217, 119, 6, 0.36))"
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
                "fill" => "rgba(217, 119, 6, 0.24)",
                "stroke" => "#8f3d16",
                "opacity" => 0.22,
                "scale" => 1.04,
                "translate" => 12,
                "staggerMs" => 18,
                "includeMarker" => false,
                "shadow" => "drop-shadow(0 0 14px rgba(217, 119, 6, 0.28))"
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
              "meta" => %{"navigate" => "/dashboard"}
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
              "meta" => %{"navigate" => "/dashboard"}
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
              "meta" => %{"navigate" => "/dashboard"}
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
              "meta" => %{"navigate" => "/dashboard"}
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
        "Techtree stays the research loop. The bridge page keeps the public purpose, the reuse pattern, and the handoff path readable before you move to the external surface.",
      tags: ["Live public frontier", "Research-first", "Bridge page"],
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
        {"Primary action", "Open the live research surface"}
      ]
    },
    "gate" => %{
      title: "Open Techtree",
      subtitle: "Explicit handoff",
      summary:
        "This route is intentionally a bridge, not a mirror. The external surface owns the full research graph and benchmark workflow, and the outbound links stay explicit.",
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
        "Autolaunch owns the hotter market workflow. This bridge page keeps the live board visible, shows what is current versus settled, and sends people out to the real auction surface for action.",
      tags: ["Market-first", "Fuse conduits", "Bridge page"],
      table: [
        {"Best for", "Launches, bidding, settlement"},
        {"Surface tone", "Verdigris, copper, ember"},
        {"External route", "autolaunch.sh"}
      ]
    },
    "market" => %{
      title: "Live market board",
      subtitle: "Readable velocity",
      summary:
        "The scene keeps urgency symbolic, but the bridge route still explains current and past market state in plain English. Financial actions remain explicit and outbound.",
      tags: ["Current board", "Past board", "Explicit links"],
      table: [
        {"Current board", "__CURRENT__"},
        {"Past board", "__PAST__"},
        {"Operator move", "Open the live market"}
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
        {"Current route", "/dashboard"},
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

  def home_scene(card_id), do: @home_scenes |> Map.fetch!(card_id) |> scene_from_entries()

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

    marker =
      SceneSpec.marker(target_id,
        label: node["label"] || node_id,
        sigil: node["sigil"],
        kind: node["kind"],
        status: status,
        meta: meta,
        command_id: "#{node_id}:body"
      )

    commands =
      case geometry do
        "socket" ->
          [
            SceneSpec.add_sphere(
              "#{node_id}:body",
              SceneSpec.sphere_center(position, size),
              SceneSpec.sphere_radius(size),
              style: SceneSpec.node_style(status),
              hover_cycle: hover_cycle,
              target_id: target_id,
              scale: SceneSpec.socket_scale(size, status),
              scale_origin: [0.5, 1, 0.5]
            )
          ]

        "carved_cube" ->
          [
            SceneSpec.add_box(
              "#{node_id}:body",
              position,
              size,
              style: SceneSpec.node_style(status),
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
              "#{node_id}:body",
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
              "#{node_id}:body",
              position,
              size,
              style: SceneSpec.node_style(status),
              hover_cycle: hover_cycle,
              target_id: target_id,
              scale: [0.88, 0.92, 0.88],
              scale_origin: [0.5, 1, 0.5]
            )
          ]

        "monolith" ->
          [
            SceneSpec.add_box(
              "#{node_id}:body",
              position,
              size,
              style: SceneSpec.node_style(status),
              hover_cycle: hover_cycle,
              target_id: target_id,
              scale: [0.9, 1, 0.9],
              scale_origin: [0.5, 1, 0.5]
            )
          ]

        _ ->
          [
            SceneSpec.add_box(
              "#{node_id}:body",
              position,
              size,
              style: SceneSpec.node_style(status),
              opaque: Map.get(node, "opaque"),
              hover_cycle: hover_cycle,
              target_id: target_id,
              scale: SceneSpec.default_scale(node, status),
              scale_origin: SceneSpec.default_scale_origin(node, status)
            )
          ]
      end

    %{commands: commands, marker: marker}
  end

  defp conduit_commands(conduit, nodes_by_id) do
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
