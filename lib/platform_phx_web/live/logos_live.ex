defmodule PlatformPhxWeb.LogosLive do
  use PlatformPhxWeb, :live_view

  @regent_card_entries [
    {"Split",
     "Starts from the equidistant elbow quadrant, then rotates that same denser piece into all four quadrants."},
    {"Hinge",
     "A tighter center-facing curve that still leaves a full blank cross between the pieces."},
    {"Relay", "Keeps the single hook fat enough to read cleanly once it is rotated four ways."},
    {"Gate", "Pulls the stroke inward while preserving visible breathing room around both axes."},
    {"Crest", "A denser hook that still refuses to let the four pieces touch."},
    {"Chamber", "Pushes more voxel weight into the turn while keeping every quadrant distinct."},
    {"Arc", "Rounds the stroke more aggressively before it releases into the outer field."},
    {"Lintel", "Lets the upper run linger slightly longer without collapsing the center gap."},
    {"Mirror",
     "Balances the four rotated hooks so they feel identical rather than merely mirrored."},
    {"Quadrant", "The most direct version of the one-shape-rotated-four-times idea."},
    {"Vault", "A heavier curve with the same separate four-piece construction."},
    {"Signal", "Uses a wider center gap so the empty cross becomes part of the mark."},
    {"Sigil", "The fullest pass before the rotated hooks start feeling too close together."},
    {"Carve", "Cuts harder toward the axes while preserving the blank center."},
    {"Latch", "A sharper turn that still reads as four detached strokes."},
    {"Crown", "The fullest separate-piece study with the strongest empty cross."}
  ]

  @regent_elbow_card_entries [
    {"Reference",
     "The thinnest, most diagonal-matched pass: a long top-right elbow facing a detached lower-left elbow with a wider chamber."},
    {"Short Crown", "Trims the top reach slightly while keeping the same clear breathing room."},
    {"Soft Fall", "Shortens the right descent so the outer elbow feels lighter and calmer."},
    {"Long Crown", "Extends the top run before the outer elbow starts dropping."},
    {"Long Floor", "Lets the lower bar travel farther right under the outer leg."},
    {"Early Bend",
     "Starts the outer turn sooner, gives the large elbow a thicker ridged crook, and drops one voxel into the small elbow’s interior bend."},
    {"Wide Chamber",
     "Pushes the two elbows farther apart so the negative space reads more clearly."},
    {"Compact", "Compresses the silhouette while keeping the same detached two-part read."},
    {"Narrow Floor", "Tightens the lower sweep while keeping the two elbows detached."},
    {"Stretch Chamber",
     "Opens the whole silhouette while preserving the same diagonal-matched bend."},
    {"Late Exit", "Lets the outer right leg travel longer before it exits."},
    {"Short Sweep", "Trims the lower elbow so the chamber opens downward a little more."},
    {"Lean Crown", "Pulls the upper reach in slightly while keeping the same elbow grammar."},
    {"Tight Fall", "Keeps the two-part read but shortens the outer fall."},
    {"Forward Sweep", "Pushes the outer bend forward before it settles into the right leg."},
    {"Stretch", "The longest symmetric pass in the elbow family."}
  ]

  @techtree_card_entries [
    {"Relay",
     "Builds T_alpha first, then lets T_beta step one chamber back from the stem anchor."},
    {"Span", "The alpha and beta pair stay fixed while the crop opens around the arm span."},
    {"Lattice", "A calmer framing pass for the same linked twin-T construction."},
    {"Ledger", "Flattens the camera a touch so the beta handoff reads more like a proof line."},
    {"Branch", "Keeps the four-voxel arms crisp while tightening the overall field."},
    {"Stack", "Pushes the depth cue a little harder so the beta stack shows sooner."},
    {"Junction", "Leans into the 3x3 node mass before the linked second stack takes over."},
    {"Atlas", "A wider crop that lets the shorter five-voxel stem stay legible."},
    {"Proof", "Pulls the pair closer so the alpha-to-beta relay feels stamped and deliberate."},
    {"Archive", "A quieter read that keeps the same link but lowers the visual pressure."},
    {"Graph", "A tighter field that makes the beta anchor feel more structural."},
    {"Link", "Lets the back stack show more clearly from the stem-to-arm connection point."},
    {"Observatory", "A measured pass that keeps the alpha-beta construction exact."},
    {"Canopy", "Softens the crop while preserving the same offset and handoff."},
    {"Index", "A crisper chamber read with the same linked twin-T geometry."},
    {"Tower", "The most direct T_alpha / T_beta study in the full set."}
  ]

  @autolaunch_card_entries [
    {"Signal", "Shorter axes and raised double-width ticks in the cleanest launch read."},
    {"Tape", "Keeps the same chart grammar with slightly tighter spacing."},
    {"Lift", "Raises the last tick harder so the climb reads faster."},
    {"Bid", "A flatter base with more separation between the raised markers."},
    {"Ramp", "Brings the mid tick closer to the axis for a denser board."},
    {"Market", "Spreads the three raised bars without lengthening the axes."},
    {"Candle", "A tighter candle-board rhythm with thicker two-block ticks."},
    {"Board", "Leans into the screenshot’s stepped graph feel most directly."},
    {"Pulse", "A softer climb where the last two bars stay closer together."},
    {"Launch", "A deeper board that still keeps the shorter axis rule."},
    {"Ignition", "The hottest variant with a taller final raised marker."},
    {"Forge", "A more compact graph with the same three raised bars."},
    {"Ember", "Pulls the first raised tick nearer to the corner."},
    {"Sprint", "Pushes the second and third ticks outward for more acceleration."},
    {"Claim", "A steadier staircase read with a heavier lower board."},
    {"Close", "The tightest short-axis market icon in the expanded set."}
  ]

  defp build_cards(entries) do
    entries
    |> Enum.with_index(1)
    |> Enum.map(fn {{title, note}, index} ->
      %{id: "study-#{index}", title: title, note: note}
    end)
  end

  @impl true
  def mount(_params, _session, socket) do
    {:ok,
     socket
     |> assign(:page_title, "Logo Studies")
     |> assign(:default_logo_theme, "blueprint")
     |> assign(:logo_sections, logo_sections())}
  end

  defp logo_sections do
    [
      %{
        brand: "regents",
        theme_class: "rg-regent-theme-platform",
        eyebrow: "Regent glyph",
        title: "Sixteen rotated Heerich studies for the Regent mark",
        summary:
          "These studies now build one ideal curved stroke in a single quadrant, keep one or two blank voxels of breathing room around the center axes, and then rotate that exact stroke into the other three quadrants. The result is four separate three-layer pieces, not one fused inner mass.",
        chips: ["Four separate hooks", "Rotated quadrants", "Center gap preserved"],
        cards: build_cards(@regent_card_entries)
      },
      %{
        brand: "regent-elbow",
        theme_class: "rg-regent-theme-platform",
        eyebrow: "Elbow reference",
        title: "Sixteen three-layer Heerich studies for the Regent elbow",
        summary:
          "These studies stay with the single-shape reference you described: two thick rounded elbows facing each other, not a closed loop. Each elbow now uses matched horizontal and vertical runs so its turn reads more evenly on the 45-degree diagonal, while the chamber between the outer top-right elbow and the detached inner lower-left elbow stays more open. The depth still comes from three stacked layers in the Heerich scene, not from making the face view chunky.",
        chips: ["Two facing elbows", "45-degree matched turns", "Three layers"],
        cards: build_cards(@regent_elbow_card_entries)
      },
      %{
        brand: "techtree",
        theme_class: "rg-regent-theme-techtree",
        eyebrow: "Techtree sigil",
        title: "Sixteen stacked-T Heerich studies for Techtree",
        summary:
          "Each study now starts with T_alpha: a two-layer T built from a 3x3 node block, four-voxel side arms, and a five-voxel stem. T_beta is an identical two-layer copy placed behind it so the left-arm tip of beta sits directly behind the bottom stem voxel of alpha. The variation comes from crop, scale, and shallow camera tuning rather than changing the construction.",
        chips: ["T_alpha + T_beta", "4 layers total", "5-voxel stem"],
        cards: build_cards(@techtree_card_entries)
      },
      %{
        brand: "autolaunch",
        theme_class: "rg-regent-theme-autolaunch",
        eyebrow: "Autolaunch tape",
        title: "Sixteen short-axis Heerich studies for Autolaunch",
        summary:
          "These studies stay close to the block-chart reference: the axes are shorter, the rising markers are two voxels wide, and the whole staircase sits one unit higher on the board.",
        chips: ["Shorter axis", "Raised double ticks", "Forge palette"],
        cards: build_cards(@autolaunch_card_entries)
      }
    ]
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app
      flash={@flash}
      current_scope={assigns[:current_scope]}
      chrome={:app}
      theme_class="rg-regent-theme-platform"
    >
      <div
        id="platform-logo-shell"
        class="pp-demo-shell rg-regent-theme-platform"
        phx-hook="DemoReveal"
      >
        <div
          id="platform-logo-root"
          class="pp-logo-root"
          data-logo-theme={@default_logo_theme}
          phx-hook="LogoStudies"
        >
          <main id="platform-logo-lab" class="pp-demo-stage" aria-label="Heerich logo studies">
            <section class="pp-demo-hero pp-logo-hero" data-demo-block>
              <div class="space-y-4">
                <p class="pp-home-kicker">Heerich logo lab</p>
                <div class="space-y-3">
                  <h1 class="pp-home-title">
                    Four study families, sixteen voxel reads each, one live theme switch.
                  </h1>
                  <p class="pp-home-copy">
                    This route is a local test bench for denser Heerich logo studies. Each family keeps a source silhouette in view, then varies spacing, layer structure, and block mass so you can compare how closely the voxel reads stay with the reference shapes.
                  </p>
                </div>
              </div>

              <div class="pp-logo-hero-tools">
                <div class="pp-home-chip-row" aria-label="Logo lab rules">
                  <span>64 live Heerich scenes</span>
                  <span>Shallow oblique camera</span>
                  <span>Blue / cream and mono toggle</span>
                </div>

                <div class="pp-logo-toggle" role="group" aria-label="Logo theme toggle">
                  <button
                    type="button"
                    class="pp-logo-toggle-button"
                    data-logo-theme-button
                    data-logo-theme-value="blueprint"
                    aria-pressed="true"
                  >
                    Blue / cream
                  </button>
                  <button
                    type="button"
                    class="pp-logo-toggle-button"
                    data-logo-theme-button
                    data-logo-theme-value="mono"
                    aria-pressed="false"
                  >
                    Black / white
                  </button>
                </div>
              </div>
            </section>

            <%= for section <- @logo_sections do %>
              <section
                id={"platform-logo-section-#{section.brand}"}
                class={["pp-logo-section", section.theme_class]}
                data-demo-block
              >
                <div class="pp-logo-section-copy">
                  <div class="space-y-3">
                    <p class="pp-home-kicker">{section.eyebrow}</p>
                    <h2 class="pp-route-panel-title">{section.title}</h2>
                    <p class="pp-panel-copy">{section.summary}</p>
                  </div>

                  <div class="pp-home-chip-row" aria-label={"#{section.title} tags"}>
                    <%= for chip <- section.chips do %>
                      <span>{chip}</span>
                    <% end %>
                  </div>
                </div>

                <div class="pp-logo-row" aria-label={"#{section.title} attempts"}>
                  <%= for card <- section.cards do %>
                    <article
                      id={"platform-logo-card-#{section.brand}-#{card.id}"}
                      class="pp-logo-card"
                      data-logo-card
                    >
                      <div class="pp-logo-card-copy">
                        <div class="space-y-2">
                          <p class="pp-home-kicker">{card.title}</p>
                          <p class="pp-panel-copy">{card.note}</p>
                        </div>

                        <div
                          class="pp-logo-canvas"
                          data-logo-scene
                          data-logo-brand={section.brand}
                          data-logo-variant={card.id}
                          aria-label={"#{section.title} #{card.title}"}
                        >
                        </div>

                        <dl class="pp-logo-meta" aria-label={"#{card.title} scene stats"}>
                          <div>
                            <dt>Voxels</dt>
                            <dd data-logo-voxel-count>--</dd>
                          </div>
                          <div>
                            <dt>Depth</dt>
                            <dd data-logo-depth>--</dd>
                          </div>
                          <div>
                            <dt>Mode</dt>
                            <dd data-logo-mode>--</dd>
                          </div>
                        </dl>

                        <div class="pp-logo-actions" aria-label={"#{card.title} downloads"}>
                          <button
                            type="button"
                            class="pp-logo-download-button"
                            data-logo-download="png"
                          >
                            Download PNG
                          </button>
                          <button
                            type="button"
                            class="pp-logo-download-button"
                            data-logo-download="svg"
                          >
                            Download SVG
                          </button>
                        </div>
                      </div>
                    </article>
                  <% end %>
                </div>
              </section>
            <% end %>
          </main>
        </div>
      </div>
    </Layouts.app>
    """
  end
end
