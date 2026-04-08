defmodule PlatformPhx.AgentPlatform.TemplateCatalog do
  @moduledoc false

  def list do
    Enum.map(base_templates(), &decorate/1)
  end

  def get(key) when is_binary(key) do
    base_templates()
    |> Enum.find(&(&1.key == key))
    |> case do
      nil -> nil
      template -> decorate(template)
    end
  end

  def get(_key), do: nil

  defp decorate(template) do
    Map.merge(template, %{
      connection_defaults: [
        %{kind: "wallet", status: "action_required", display_name: "Bankr wallet"},
        %{kind: "x", status: "action_required", display_name: "X account"},
        %{kind: "slack", status: "action_required", display_name: "Slack workspace"},
        %{kind: "payments", status: "action_required", display_name: "Tenant payment config"}
      ],
      runtime_defaults: %{
        sprite_owner: "regents",
        sprite_service_name: "paperclip",
        paperclip_deployment_mode: "authenticated",
        paperclip_http_port: 3100,
        hermes_adapter_type: "hermes_local",
        hermes_model: "glm-5.1",
        hermes_persist_session: true,
        hermes_toolsets: template.hermes_toolsets,
        paperclip_company_purpose: template.paperclip_company_purpose,
        hermes_worker_role: template.hermes_worker_role,
        recommended_network_domains: template.recommended_network_domains,
        checkpoint_moments: template.checkpoint_moments
      }
    })
  end

  defp base_templates do
    [
      %{
        key: "solidity",
        public_name: "Solidity Regent",
        category: "Audit",
        summary:
          "Contract audit specialist with public findings feeds, Slack access, X posting, and payment-gated review services.",
        hero_statement:
          "Sprite-hosted Solidity audit business with a private Paperclip company, a Hermes operator, and a clean public storefront.",
        what_it_does: [
          "Reviews EVM contracts for bugs, risks, and launch blockers.",
          "Posts non-private findings and completion summaries publicly.",
          "Supports Slack intake, X posting, and wallet-based service delivery."
        ],
        paperclip_company_purpose:
          "Run a single Solidity audit business with paid reviews, public completion artifacts, and direct operator intake.",
        hermes_worker_role:
          "Primary Solidity security reviewer responsible for audits, threat models, and plain-English findings.",
        hermes_toolsets: ["terminal", "file", "web", "mcp"],
        recommended_network_domains: [
          "github.com",
          "npmjs.com",
          "anthropic.com",
          "openrouter.ai",
          "basescan.org"
        ],
        checkpoint_moments: [
          "After Paperclip is reachable on the Sprite",
          "After Hermes and the adapter are installed",
          "After the service menu and public feed are published"
        ],
        services: [
          service(
            "solidity-audit",
            "Solidity audit",
            "Ranked findings and remediation notes for a live or pre-launch contract review.",
            "$1.25 / call",
            "x402",
            0
          ),
          service(
            "threat-model",
            "Threat model",
            "Protocol threat model and upgrade-risk pass before launch or deployment.",
            "$4.00 / run",
            "MPP",
            1
          )
        ]
      },
      %{
        key: "solana",
        public_name: "Solana Regent",
        category: "Audit",
        summary:
          "Anchor and Sealevel audit specialist for teams that need a public service storefront and fast exploit-focused review.",
        hero_statement:
          "Sprite-hosted Solana audit business with a private Paperclip runtime and a persistent Hermes reviewer.",
        what_it_does: [
          "Reviews Solana and Anchor programs for authority, CPI, account, and signer issues.",
          "Publishes non-private review summaries after paid work is finished.",
          "Accepts Slack, X, and wallet-native service intake."
        ],
        paperclip_company_purpose:
          "Run one Solana audit company with private operator workflows and public completion summaries.",
        hermes_worker_role:
          "Primary Solana and Anchor auditor handling exploit-focused review, authority checks, and launch readiness.",
        hermes_toolsets: ["terminal", "file", "web", "mcp"],
        recommended_network_domains: [
          "github.com",
          "npmjs.com",
          "anthropic.com",
          "openrouter.ai",
          "explorer.solana.com"
        ],
        checkpoint_moments: [
          "After Paperclip is reachable on the Sprite",
          "After Hermes is registered as the main worker",
          "After the public work feed is seeded"
        ],
        services: [
          service(
            "solana-audit",
            "Solana audit",
            "Exploit-focused Solana or Anchor review with ranked findings.",
            "$1.40 / call",
            "x402",
            0
          ),
          service(
            "anchor-review",
            "Anchor review",
            "IDL, CPI, and authority review for launch readiness.",
            "$3.25 / run",
            "MPP",
            1
          )
        ]
      },
      %{
        key: "recruiter",
        public_name: "Recruiter Regent",
        category: "Recruiting",
        summary:
          "Service-agent recruiter that recommends the right specialist for a concrete business need and writes the operator handoff.",
        hero_statement:
          "Sprite-hosted agent recruiter with a private Paperclip company and a Hermes matchmaker for real business problems.",
        what_it_does: [
          "Tracks and compares useful service agents across business categories.",
          "Recommends the best specialist for the job at hand.",
          "Publishes non-private shortlist and handoff summaries."
        ],
        paperclip_company_purpose:
          "Run a service-agent recruiting company that delivers shortlists and handoff briefs.",
        hermes_worker_role:
          "Primary agent recruiter responsible for market scans, specialist matching, and operator handoffs.",
        hermes_toolsets: ["terminal", "file", "web"],
        recommended_network_domains: [
          "github.com",
          "anthropic.com",
          "openrouter.ai",
          "x.com"
        ],
        checkpoint_moments: [
          "After Paperclip is reachable on the Sprite",
          "After the recruiting sources are configured",
          "After the public shortlist feed is published"
        ],
        services: [
          service(
            "agent-shortlist",
            "Agent shortlist",
            "Recommend the best service agents for a specific business task.",
            "$0.90 / call",
            "x402",
            0
          ),
          service(
            "operator-brief",
            "Operator brief",
            "Write the setup and handoff brief for the chosen agent stack.",
            "$2.50 / run",
            "MPP",
            1
          )
        ]
      },
      %{
        key: "growth",
        public_name: "Growth Regent",
        category: "Growth",
        summary:
          "Growth marketing operator for agent businesses that need channels, posting rhythm, and measurable acquisition loops.",
        hero_statement:
          "Sprite-hosted growth operator with a persistent Hermes worker for launches, campaigns, and public posting rhythm.",
        what_it_does: [
          "Builds channel strategy and growth loops for agent businesses.",
          "Turns agent outputs into public posting and campaign assets.",
          "Publishes non-private outcome summaries for completed work."
        ],
        paperclip_company_purpose:
          "Run a growth marketing company for agent businesses with paid planning and public proof-of-work.",
        hermes_worker_role:
          "Primary growth operator responsible for launch plans, content calendars, and channel strategy.",
        hermes_toolsets: ["terminal", "file", "web", "creative"],
        recommended_network_domains: [
          "github.com",
          "anthropic.com",
          "openrouter.ai",
          "x.com",
          "farcaster.xyz"
        ],
        checkpoint_moments: [
          "After Paperclip is reachable on the Sprite",
          "After posting and campaign tools are connected",
          "After the launch calendar artifact is published"
        ],
        services: [
          service(
            "growth-plan",
            "Growth plan",
            "Channel and funnel map for an agent business.",
            "$1.10 / call",
            "x402",
            0
          ),
          service(
            "launch-calendar",
            "Launch calendar",
            "30-day content and campaign plan for a launch or relaunch.",
            "$3.75 / run",
            "MPP",
            1
          )
        ]
      },
      %{
        key: "research",
        public_name: "Research Regent",
        category: "Research",
        summary:
          "Research workflow specialist that recommends and runs the best skills and tools for science and technical investigation.",
        hero_statement:
          "Sprite-hosted research company with a persistent Hermes worker for studies, evals, and tool selection.",
        what_it_does: [
          "Maps the right skills and tools to research-heavy work.",
          "Runs scoped research or evaluation workflows.",
          "Publishes non-private summaries for finished work."
        ],
        paperclip_company_purpose:
          "Run a research and science workflow company with reproducible outputs and skill-aware operator guidance.",
        hermes_worker_role:
          "Primary research operator responsible for workflow design, study execution, and tool recommendations.",
        hermes_toolsets: ["terminal", "file", "web", "mcp", "code_execution"],
        recommended_network_domains: [
          "github.com",
          "anthropic.com",
          "openrouter.ai",
          "huggingface.co",
          "arxiv.org"
        ],
        checkpoint_moments: [
          "After Paperclip is reachable on the Sprite",
          "After research sources and MCP tools are configured",
          "After the first public study artifact is published"
        ],
        services: [
          service(
            "skill-plan",
            "Skill plan",
            "Recommend the right skills, tools, and agent workflow for a research task.",
            "$1.00 / call",
            "x402",
            0
          ),
          service(
            "study-run",
            "Study run",
            "Run a scoped research or evaluation workflow and publish the non-private summary.",
            "$4.50 / run",
            "MPP",
            1
          )
        ]
      },
      %{
        key: "tempo",
        public_name: "Tempo Regent",
        category: "Operations",
        summary:
          "Operations tempo specialist for teams managing recurring agent work, posting cadence, and service delivery rhythm.",
        hero_statement:
          "Sprite-hosted operations company with a Hermes worker focused on recurring execution, rhythm, and checkpoints.",
        what_it_does: [
          "Designs weekly and monthly operating rhythms.",
          "Maps recurring jobs and operator checkpoints.",
          "Publishes non-private cadence and automation summaries."
        ],
        paperclip_company_purpose:
          "Run an operations cadence company for multi-agent businesses with recurring jobs and public summaries.",
        hermes_worker_role:
          "Primary operations tempo operator responsible for recurring schedules, checkpoints, and operator pacing.",
        hermes_toolsets: ["terminal", "file", "web", "productivity"],
        recommended_network_domains: [
          "github.com",
          "anthropic.com",
          "openrouter.ai",
          "slack.com"
        ],
        checkpoint_moments: [
          "After Paperclip is reachable on the Sprite",
          "After recurring workflows are configured",
          "After the cadence report artifact is published"
        ],
        services: [
          service(
            "tempo-plan",
            "Tempo plan",
            "Weekly operating tempo for a multi-agent business.",
            "$0.95 / call",
            "x402",
            0
          ),
          service(
            "automation-pack",
            "Automation pack",
            "Recurring workflow and checkpoint setup for operator teams.",
            "$3.10 / run",
            "MPP",
            1
          )
        ]
      },
      %{
        key: "start",
        public_name: "Start Regent",
        category: "Launch",
        summary:
          "Zero-to-one launch specialist for new agent businesses that need naming, runtime, wallet, posting, and pricing setup.",
        hero_statement:
          "Sprite-hosted launch company that takes a new agent business from idea to Paperclip runtime and public storefront.",
        what_it_does: [
          "Helps operators package an agent into a real service business.",
          "Defines the first runtime, menu, pricing, and public rails.",
          "Publishes non-private kickoff and launch summaries."
        ],
        paperclip_company_purpose:
          "Run a launch setup company that turns new agent ideas into working Sprite, Paperclip, and storefront deployments.",
        hermes_worker_role:
          "Primary launch operator responsible for setup briefs, provisioning plans, and first-service packaging.",
        hermes_toolsets: ["terminal", "file", "web", "productivity"],
        recommended_network_domains: [
          "github.com",
          "anthropic.com",
          "openrouter.ai",
          "slack.com",
          "x.com"
        ],
        checkpoint_moments: [
          "After Paperclip is reachable on the Sprite",
          "After Hermes and payment rails are connected",
          "After the kickoff artifact is published"
        ],
        services: [
          service(
            "start-plan",
            "Start plan",
            "Turn an agent idea into a launch-ready operating brief.",
            "$1.05 / call",
            "x402",
            0
          ),
          service(
            "foundry-setup",
            "Foundry setup",
            "Draft the runtime, wallet, and menu setup for a new agent.",
            "$3.95 / run",
            "MPP",
            1
          )
        ]
      }
    ]
  end

  defp service(slug, name, summary, price_label, payment_rail, sort_order) do
    %{
      slug: slug,
      name: name,
      summary: summary,
      price_label: price_label,
      payment_rail: payment_rail,
      public_result_default: true,
      sort_order: sort_order
    }
  end
end
