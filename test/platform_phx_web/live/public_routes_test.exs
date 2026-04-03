defmodule PlatformPhxWeb.PublicRoutesTest do
  use PlatformPhxWeb.ConnCase, async: true

  import Phoenix.LiveViewTest

  test "home route renders", %{conn: conn} do
    {:ok, _home, html} = live(conn, "/")

    assert html =~ "Regents Labs"
    assert html =~ "$REGENT"
    assert html =~ "platform-home-shell"
    assert html =~ "entry-card-surface-techtree-home"
    assert html =~ "entry-card-surface-autolaunch-home"
    assert html =~ "entry-card-surface-dashboard-home"
    assert html =~ "/images/techtree-logo.png"
    assert html =~ "/images/autolaunch-logo.png"
    assert html =~ "/images/regents-logo.png"
    assert html =~ "https://x.com/regents_sh"
    assert html =~ "https://farcaster.xyz/regent"
    assert html =~ "https://discord.gg/regents"
    assert html =~ "https://github.com/orgs/regent-ai/repositories"

    assert html =~
             "https://www.geckoterminal.com/base/pools/0x4ed3b69ac263ad86482f609b2c2105f64bcfd3a7e02e8e078ec9fec1f0324bed"

    assert html =~ "platform-footer-voxel-classic"
    assert html =~ "data-color-mode-cycle"
    assert html =~ "aria-label=\"Research\""
    assert html =~ "aria-label=\"Revenue\""
    assert html =~ "aria-label=\"Open\""
    assert html =~ "href=\"/overview\""
    assert html =~ "platform-footer-voxel-classic"

    assert html =~
             "Upgrade your Claw or Hermes agent to collaborate and autoresearch. First tech:"

    assert html =~ "https://huggingface.co/datasets/nvidia/Nemotron-RL-bixbench_hypothesis"
    assert html =~ "BBH-Train"
    assert html =~ "benchmark by Nvidia."
    assert html =~ "Capable agents can raise capital through a fair 3 day Uniswap CCA auction."
    assert html =~ "Your agent now has funds to immediately scale token, API, and server costs."
    assert html =~ "Token holders share upside in future revenue."
  end

  test "demo route renders", %{conn: conn} do
    {:ok, _demo, html} = live(conn, "/demo")

    assert html =~ "platform-demo-shell"
    assert html =~ "platform-demo-stage"
    assert html =~ "demo-surface-techtree"
    assert html =~ "demo-surface-dashboard"
    assert html =~ "demo-surface-autolaunch"
    assert html =~ "Regents voxel demo"
  end

  test "overview route renders", %{conn: conn} do
    {:ok, _overview, html} = live(conn, "/overview")

    assert html =~ "Regents Overview"
    assert html =~ "Overview"
    assert html =~ "platform-footer-voxel-classic"
    assert html =~ "Human Overview"
    assert html =~ "Agent Overview"
    assert html =~ "Using Regents as a human operator"
    assert html =~ "Regents is for a Claw/Hermes-type agent to flourish"
    assert html =~ "npm install -g @regentlabs/cli"
    assert html =~ "planned package name for the shared operator surface"
    assert html =~ "access opens"
    assert html =~ "Access Soon"
    assert html =~ "aria-disabled=\"true\""
    assert html =~ "phx-hook=\"OverviewMode\""
    assert html =~ "platform-footer-voxel-classic"
    assert html =~ "data-mode=\"human\""
    assert html =~ "platform-overview-human-scene"
    assert html =~ "platform-overview-agent-scene"

    assert html =~ ~r/href="\/overview".*href="\/token-info"/s
  end

  test "overview route accepts regent scene lifecycle events", %{conn: conn} do
    {:ok, overview, _html} = live(conn, "/overview")

    assert render_hook(overview, "regent:surface_ready", %{
             "active_face" => "entry",
             "rendered_targets" => 1,
             "scene_version" => 2
           }) =~ "platform-overview-human-scene"

    assert render_hook(overview, "regent:surface_error", %{
             "message" => "test"
           }) =~ "platform-overview-agent-scene"
  end

  test "services route renders", %{conn: conn} do
    {:ok, _services, html} = live(conn, "/services")

    assert html =~ "Services and Docs"
    assert html =~ "Services"
    assert html =~ "https://news.regents.sh"
    assert html =~ "Community"
    assert html =~ "https://x.com/regents_sh"
    assert html =~ "https://farcaster.xyz/regent"
    assert html =~ "https://discord.gg/regents"
    assert html =~ "https://github.com/orgs/regent-ai/repositories"

    assert html =~
             "https://www.geckoterminal.com/base/pools/0x4ed3b69ac263ad86482f609b2c2105f64bcfd3a7e02e8e078ec9fec1f0324bed"

    assert html =~ "phx-hook=\"SidebarCommunity\""
    assert html =~ "platform-footer-voxel-classic"
    assert html =~ "dashboard-root"

    refute html =~
             "A growing platform for all documentation and actions to take part in the Regents ecosystem."

    refute html =~ "platform-dashboard-surface"
  end

  test "heerich demo route renders", %{conn: conn} do
    {:ok, _demo, html} = live(conn, "/heerich-demo")

    assert html =~ "Heerich 0.7.1 Lab"
    assert html =~ "platform-heerich-demo-shell"
    assert html =~ "demo-explode-cluster"
    assert html =~ "addGeometry(type: fill)"
    assert html =~ "applyStyle(type: box / line)"
  end

  test "logos route renders", %{conn: conn} do
    {:ok, _logos, html} = live(conn, "/logos")

    assert html =~ "Four study families, sixteen voxel reads each, one live theme switch."
    assert html =~ "platform-logo-root"
    assert html =~ "platform-logo-section-regents"
    assert html =~ "platform-logo-section-autolaunch"
    assert html =~ "Download PNG"
    assert html =~ "Download SVG"
  end

  test "techtree route renders", %{conn: conn} do
    {:ok, _techtree, html} = live(conn, "/techtree")

    assert html =~ "Shared Research and Eval Tree"
    assert html =~ "Techtree"
    assert html =~ "Agent Skill"
    assert html =~ "Techtree gives agents a public graph for open autoresearch."
    assert html =~ "notebook, eval, harness, skill, trace"
    assert html =~ "replicable Python notebooks on marimo.io"
    assert html =~ "open data and code on IPFS"
    assert html =~ "Edison Scientific and Nvidia"
    assert html =~ "https://edisonscientific.com/articles/accelerating-science-at-scale"
    assert html =~ "Linked tools, runtimes, research surfaces, and platforms behind Techtree."
    assert html =~ "Privy"
    assert html =~ "IPFS"
    assert html =~ "Ethereum"
    assert html =~ "Base"
    assert html =~ "https://openclaw.sh"
    assert html =~ "https://elixir-lang.org"
    assert html =~ "https://www.phoenixframework.org"
    assert html =~ "https://privy.io"
    assert html =~ "https://ipfs.io"
    assert html =~ "https://ethereum.org"
    assert html =~ "https://base.org"
    assert html =~ "public product is still in preview"
    assert html =~ "regent techtree start"
    assert html =~ "regent techtree autoskill publish skill"
    assert html =~ "regent techtree bbh capsules list"
    assert html =~ "Open techtree.sh"
    assert html =~ "https://github.com/regent-ai/techtree"
    assert html =~ "Access Soon"
    assert html =~ "[Techtree skill.md coming soon]"
    assert html =~ "Agents work on tech to add to the tree, earning reputation and tokens"
    refute html =~ "Copy prompt"
    refute html =~ "Why this surface exists"
    refute html =~ "platform-techtree-surface"
  end

  test "autolaunch route renders", %{conn: conn} do
    {:ok, _autolaunch, html} = live(conn, "/autolaunch")

    assert html =~ "Raise agent capital"
    assert html =~ "Autolaunch"
    assert html =~ "Agent Skill"
    assert html =~ "Autolaunch helps agents raise capital before they scale."
    assert html =~ "Uniswap CCA auctions"
    assert html =~ "revsplit contract"
    assert html =~ "ERC-8004 registration"
    assert html =~ "Linked tools, runtimes, agent surfaces, and platforms behind Autolaunch."
    assert html =~ "Privy"
    assert html =~ "IPFS"
    assert html =~ "Ethereum"
    assert html =~ "Base"
    assert html =~ "upcoming market surface"
    assert html =~ "regent autolaunch prelaunch wizard"
    assert html =~ "regent autolaunch launch finalize"
    assert html =~ "regent autolaunch trust x-link --agent &lt;id&gt;"
    assert html =~ "Open autolaunch.sh"
    assert html =~ "https://github.com/regent-ai/autolaunch"
    assert html =~ "Access Soon"
    assert html =~ "[Autolaunch skill.md coming soon]"
    refute html =~ "Copy prompt"
    assert html =~ "https://openclaw.sh"
    assert html =~ "https://elixir-lang.org"
    assert html =~ "https://www.phoenixframework.org"
    assert html =~ "https://privy.io"
    assert html =~ "https://ipfs.io"
    assert html =~ "https://ethereum.org"
    assert html =~ "https://base.org"
    refute html =~ "Why this surface exists"
    refute html =~ "platform-autolaunch-surface"
  end

  test "regent cli route renders", %{conn: conn} do
    {:ok, _regent_cli, html} = live(conn, "/regent-cli")

    assert html =~ "Local Operator Surface"
    assert html =~ "Regent CLI"
    assert html =~ "Copy page as markdown"
    assert html =~ "Local runtime and operator surface for"
    assert html =~ "@regentlabs/cli"
    assert html =~ "regent create init"
    assert html =~ "regent create wallet --write-env"
    assert html =~ "regent techtree start"
    assert html =~ "regent auth siwa login"
    assert html =~ "The CLI is JSON-first."
    assert html =~ "regent chatbox history --webapp|--agent"
    assert html =~ "CLI posting is agent-room only."
    assert html =~ "regent autolaunch ..."
  end

  test "token info route renders", %{conn: conn} do
    {:ok, token_info, html} = live(conn, "/token-info")

    assert html =~ "Token Purpose"
    assert html =~ "$REGENT is staked to earn your share of protocol revenue."
    assert html =~ "The majority of revenue is used to buyback $REGENT."
    assert html =~ "$REGENT is live on Base"

    assert html =~ "Platform revenue token"
    assert html =~ "Agent economies"

    assert html =~
             "https://app.uniswap.org/explore/tokens/base/0x6f89bca4ea5931edfcb09786267b251dee752b07?inputCurrency=NATIVE"

    assert html =~
             "https://www.geckoterminal.com/base/pools/0x4ed3b69ac263ad86482f609b2c2105f64bcfd3a7e02e8e078ec9fec1f0324bed"

    assert html =~
             "https://dexscreener.com/base/0x4ed3b69ac263ad86482f609b2c2105f64bcfd3a7e02e8e078ec9fec1f0324bed"

    assert html =~ "View on Uniswap"
    assert html =~ "View on GeckoTerminal"
    assert html =~ "View on Dexscreener"
    assert html =~ "Autolaunch"
    assert html =~ "Techtree"
    assert html =~ "$REGENT staking emissions"
    assert html =~ "20% yield for initial year"
    assert html =~ "The staking portal and emission claims will open through Autolaunch"
    assert html =~ "pp-token-fee-highlight"
    assert html =~ "agent token&#39;s trading fees from the Uniswap v4 fee hook"
    assert html =~ "raised USDC in CCA auctions."
    assert html =~ "Stablecoin Revenues"
    assert html =~ "Regents Platform"
    assert html =~ "Stake $REGENT in the protocol revsplit contract."
    assert html =~ "Claim your stablecoin share of Regent Labs revenue anytime."

    assert html =~ "80% or more of protocol skim will go to buybacks."

    assert html =~
             "Openclaw and Hermes agent hosting, with Stripe LLM billing for margin fees on hosted Regents."

    assert html =~ "Where revenue enters the system"
    assert html =~ "Token Holders"
    assert html =~ "Snapshot of largest token locks, pools, and holders"

    assert html =~
             "As of 4/1/2026 the large majority of tokens are locked or held by the following 6 addresses."

    assert html =~ "0x8E84...DF6C"
    assert html =~ "0x46F4...C002"
    assert html =~ "7th through 2,208th: Regent Community Members!"
    assert html =~ "Regent Token Allocations and Uses"
    assert html =~ "20% to Clanker Deployment"
    assert html =~ "40% Regents Labs Multisig"
    assert html =~ "40% Clanker Vault - Locked onchain for 1 year then vesting over 2 years"
    assert html =~ "20% Clanker public + 40% growth emissions + 40% long-term incentives."
    assert html =~ "Sovereign Agent Incentives"
    refute html =~ "token for all platforms"
    refute html =~ "All Regents Labs product value flows to $REGENT"
    refute html =~ "Click a row to open the holder drawer."
    refute html =~ "40% airdrop to Regent Labs multisig for the following:"

    unknown_holder_html =
      token_info
      |> element("button[phx-value-rank=\"5\"]")
      |> render_click()

    assert unknown_holder_html =~ "Unknown holder who accumulated 2.5% of supply"
    refute unknown_holder_html =~ "View multichain wallet"
  end

  test "removed routes return 404", %{conn: conn} do
    for path <- ["/home", "/names", "/redeem", "/settings", "/agents", "/dashboard"] do
      response = get(recycle(conn), path)
      assert response.status == 404
    end
  end
end
