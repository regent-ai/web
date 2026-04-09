defmodule PlatformPhx.Repo.Migrations.SeedHouseAgentsAfterPlatformFoundry do
  use Ecto.Migration

  def up do
    timestamp = DateTime.utc_now() |> DateTime.truncate(:second) |> DateTime.to_iso8601()

    house_agents = [
      %{
        slug: "solidity",
        template_key: "solidity",
        name: "Solidity Regent",
        claimed_label: "solidity",
        basename_fqdn: "solidity.agent.base.eth",
        ens_fqdn: "solidity.regent.eth",
        public_summary:
          "Solidity Regent runs sharp contract audits, ships plain-English findings, and publishes non-private review artifacts after each paid engagement.",
        hero_statement:
          "Sprite-hosted Solidity audit business with a private Paperclip company, a Hermes operator, and a clean public storefront.",
        sprite_name: "solidity-sprite",
        sprite_url: "https://solidity.sprites.dev",
        paperclip_url: "https://solidity.sprites.dev",
        paperclip_company_id: "solidity-company",
        paperclip_agent_id: "solidity-hermes",
        runtime_status: "ready",
        checkpoint_status: "ready",
        wallet_address: "0x1000000000000000000000000000000000000001",
        services: [
          {"solidity-audit", "Solidity audit",
           "Full contract review with ranked findings and remediation notes.", "$1.25 / call",
           "x402"},
          {"threat-model", "Threat model",
           "Pre-deployment attack surface review for protocol upgrades or launch plans.",
           "$4.00 / run", "MPP"}
        ],
        artifact_title: "Treasury Router audit",
        artifact_summary:
          "Published findings summary for a completed Solidity treasury router review."
      },
      %{
        slug: "solana",
        template_key: "solana",
        name: "Solana Regent",
        claimed_label: "solana",
        basename_fqdn: "solana.agent.base.eth",
        ens_fqdn: "solana.regent.eth",
        public_summary:
          "Solana Regent specializes in Anchor and raw-program audits, shipping clear findings and public completion summaries for non-private work.",
        hero_statement:
          "Sprite-hosted Solana audit business with a private Paperclip runtime and a persistent Hermes reviewer.",
        sprite_name: "solana-sprite",
        sprite_url: "https://solana.sprites.dev",
        paperclip_url: "https://solana.sprites.dev",
        paperclip_company_id: "solana-company",
        paperclip_agent_id: "solana-hermes",
        runtime_status: "ready",
        checkpoint_status: "ready",
        wallet_address: "0x2000000000000000000000000000000000000002",
        services: [
          {"solana-audit", "Solana audit",
           "Anchor and Sealevel program review with exploit-focused reporting.", "$1.40 / call",
           "x402"},
          {"anchor-review", "Anchor review",
           "IDL, authority, and CPI review for launch or upgrade readiness.", "$3.25 / run",
           "MPP"}
        ],
        artifact_title: "Anchor launch review",
        artifact_summary:
          "Published review summary for a completed Anchor launch-readiness engagement."
      },
      %{
        slug: "recruiter",
        template_key: "recruiter",
        name: "Recruiter Regent",
        claimed_label: "recruiter",
        basename_fqdn: "recruiter.agent.base.eth",
        ens_fqdn: "recruiter.regent.eth",
        public_summary:
          "Recruiter Regent tracks the growing world of service agents and recommends the right specialist for a real business job.",
        hero_statement:
          "Sprite-hosted agent recruiter with a private Paperclip company and a Hermes matchmaker for real business problems.",
        sprite_name: "recruiter-sprite",
        sprite_url: "https://recruiter.sprites.dev",
        paperclip_url: "https://recruiter.sprites.dev",
        paperclip_company_id: "recruiter-company",
        paperclip_agent_id: "recruiter-hermes",
        runtime_status: "ready",
        checkpoint_status: "ready",
        wallet_address: "0x3000000000000000000000000000000000000003",
        services: [
          {"agent-shortlist", "Agent shortlist",
           "Recommend the best service agents for a concrete business problem.", "$0.90 / call",
           "x402"},
          {"operator-brief", "Operator brief",
           "Write the setup brief and connection plan for the selected agent stack.",
           "$2.50 / run", "MPP"}
        ],
        artifact_title: "Revenue ops shortlist",
        artifact_summary: "Published shortlist summary for a service-agent recruiting engagement."
      },
      %{
        slug: "growth",
        template_key: "growth",
        name: "Growth Regent",
        claimed_label: "growth",
        basename_fqdn: "growth.agent.base.eth",
        ens_fqdn: "growth.regent.eth",
        public_summary:
          "Growth Regent plans growth loops, campaign rails, and posting cadence for agents that need distribution, not vague branding advice.",
        hero_statement:
          "Sprite-hosted growth operator with a persistent Hermes worker for launches, campaigns, and public posting rhythm.",
        sprite_name: "growth-sprite",
        sprite_url: "https://growth.sprites.dev",
        paperclip_url: "https://growth.sprites.dev",
        paperclip_company_id: "growth-company",
        paperclip_agent_id: "growth-hermes",
        runtime_status: "ready",
        checkpoint_status: "ready",
        wallet_address: "0x4000000000000000000000000000000000000004",
        services: [
          {"growth-plan", "Growth plan",
           "Map channels, offers, and posting loops for an agent business.", "$1.10 / call",
           "x402"},
          {"launch-calendar", "Launch calendar",
           "Build a 30-day growth calendar with public posting hooks and KPI checkpoints.",
           "$3.75 / run", "MPP"}
        ],
        artifact_title: "Agent launch calendar",
        artifact_summary:
          "Published summary for a completed growth marketing calendar engagement."
      },
      %{
        slug: "research",
        template_key: "research",
        name: "Research Regent",
        claimed_label: "research",
        basename_fqdn: "research.agent.base.eth",
        ens_fqdn: "research.regent.eth",
        public_summary:
          "Research Regent recommends and runs the best skills and agent workflows for research, science, and technical investigation.",
        hero_statement:
          "Sprite-hosted research company with a persistent Hermes worker for studies, evals, and tool selection.",
        sprite_name: "research-sprite",
        sprite_url: "https://research.sprites.dev",
        paperclip_url: "https://research.sprites.dev",
        paperclip_company_id: "research-company",
        paperclip_agent_id: "research-hermes",
        runtime_status: "ready",
        checkpoint_status: "ready",
        wallet_address: "0x5000000000000000000000000000000000000005",
        services: [
          {"skill-plan", "Skill plan",
           "Recommend the best skills, tools, and agent workflow for a research problem.",
           "$1.00 / call", "x402"},
          {"study-run", "Study run",
           "Run a scoped research workflow and publish the non-private output summary.",
           "$4.50 / run", "MPP"}
        ],
        artifact_title: "Scientific workflow brief",
        artifact_summary:
          "Published summary for a research workflow and skill recommendation engagement."
      },
      %{
        slug: "tempo",
        template_key: "tempo",
        name: "Tempo Regent",
        claimed_label: "tempo",
        basename_fqdn: "tempo.agent.base.eth",
        ens_fqdn: "tempo.regent.eth",
        public_summary:
          "Tempo Regent builds schedules, operating tempo, and recurring execution rails for teams running multiple agents and service loops.",
        hero_statement:
          "Sprite-hosted operations company with a Hermes worker focused on recurring execution, rhythm, and checkpoints.",
        sprite_name: "tempo-sprite",
        sprite_url: "https://tempo.sprites.dev",
        paperclip_url: "https://tempo.sprites.dev",
        paperclip_company_id: "tempo-company",
        paperclip_agent_id: "tempo-hermes",
        runtime_status: "ready",
        checkpoint_status: "ready",
        wallet_address: "0x6000000000000000000000000000000000000006",
        services: [
          {"tempo-plan", "Tempo plan",
           "Design the weekly operating rhythm for a multi-agent business.", "$0.95 / call",
           "x402"},
          {"automation-pack", "Automation pack",
           "Define recurring jobs, posting cadence, and operator checkpoints.", "$3.10 / run",
           "MPP"}
        ],
        artifact_title: "Weekly operator cadence",
        artifact_summary: "Published summary for a recurring operations cadence engagement."
      },
      %{
        slug: "start",
        template_key: "start",
        name: "Start Regent",
        claimed_label: "start",
        basename_fqdn: "start.agent.base.eth",
        ens_fqdn: "start.regent.eth",
        public_summary:
          "Start Regent helps a team go from idea to operating agent business with naming, runtime setup, pricing, and public launch basics.",
        hero_statement:
          "Sprite-hosted launch company that takes a new agent business from idea to Paperclip runtime and public storefront.",
        sprite_name: "start-sprite",
        sprite_url: "https://start.sprites.dev",
        paperclip_url: "https://start.sprites.dev",
        paperclip_company_id: "start-company",
        paperclip_agent_id: "start-hermes",
        runtime_status: "ready",
        checkpoint_status: "ready",
        wallet_address: "0x7000000000000000000000000000000000000007",
        services: [
          {"start-plan", "Start plan", "Turn an agent idea into a launch-ready operating brief.",
           "$1.05 / call", "x402"},
          {"foundry-setup", "Foundry setup",
           "Draft the runtime, wallet, posting, and menu setup for a new agent.", "$3.95 / run",
           "MPP"}
        ],
        artifact_title: "Agent business kickoff",
        artifact_summary: "Published summary for a zero-to-one agent business setup engagement."
      }
    ]

    Enum.each(house_agents, fn agent ->
      execute("""
      INSERT INTO platform_agents (
        template_key,
        name,
        slug,
        claimed_label,
        basename_fqdn,
        ens_fqdn,
        status,
        public_summary,
        hero_statement,
        sprite_name,
        sprite_url,
        paperclip_url,
        paperclip_company_id,
        paperclip_agent_id,
        runtime_status,
        checkpoint_status,
        wallet_address,
        published_at,
        created_at,
        updated_at
      )
      VALUES (
        '#{agent.template_key}',
        '#{agent.name}',
        '#{agent.slug}',
        '#{agent.claimed_label}',
        '#{agent.basename_fqdn}',
        '#{agent.ens_fqdn}',
        'published',
        '#{String.replace(agent.public_summary, "'", "''")}',
        '#{String.replace(agent.hero_statement, "'", "''")}',
        '#{agent.sprite_name}',
        '#{agent.sprite_url}',
        '#{agent.paperclip_url}',
        '#{agent.paperclip_company_id}',
        '#{agent.paperclip_agent_id}',
        '#{agent.runtime_status}',
        '#{agent.checkpoint_status}',
        '#{agent.wallet_address}',
        '#{timestamp}',
        '#{timestamp}',
        '#{timestamp}'
      )
      ON CONFLICT (slug) DO NOTHING
      """)

      execute("""
      INSERT INTO platform_agent_subdomains (
        agent_id,
        slug,
        hostname,
        basename_fqdn,
        ens_fqdn,
        active,
        created_at,
        updated_at
      )
      SELECT
        id,
        '#{agent.slug}',
        '#{agent.slug}.regents.sh',
        '#{agent.basename_fqdn}',
        '#{agent.ens_fqdn}',
        true,
        '#{timestamp}',
        '#{timestamp}'
      FROM platform_agents
      WHERE slug = '#{agent.slug}'
      ON CONFLICT (hostname) DO NOTHING
      """)

      Enum.each(agent.services |> Enum.with_index(), fn {{service_slug, name, summary,
                                                          price_label, payment_rail}, index} ->
        execute("""
        INSERT INTO platform_agent_services (
          agent_id,
          slug,
          name,
          summary,
          price_label,
          payment_rail,
          delivery_mode,
          public_result_default,
          sort_order,
          created_at,
          updated_at
        )
        SELECT
          id,
          '#{service_slug}',
          '#{name}',
          '#{summary}',
          '#{price_label}',
          '#{payment_rail}',
          'async',
          true,
          #{index},
          '#{timestamp}',
          '#{timestamp}'
        FROM platform_agents
        WHERE slug = '#{agent.slug}'
        ON CONFLICT (agent_id, slug) DO NOTHING
        """)
      end)

      Enum.each(
        [
          {"wallet", "connected", agent.wallet_address},
          {"x", "connected", "@#{agent.slug}_regent"},
          {"slack", "connected", "Regents Slack"},
          {"payments", "connected", "Tenant-owned"}
        ],
        fn {kind, status, display_name} ->
          execute("""
          INSERT INTO platform_agent_connections (
            agent_id,
            kind,
            status,
            display_name,
            external_ref,
            details,
            connected_at,
            created_at,
            updated_at
          )
          SELECT
            id,
            '#{kind}',
            '#{status}',
            '#{display_name}',
            '#{agent.slug}-#{kind}',
            '{}'::jsonb,
            '#{timestamp}',
            '#{timestamp}',
            '#{timestamp}'
          FROM platform_agents
          WHERE slug = '#{agent.slug}'
          ON CONFLICT (agent_id, kind) DO NOTHING
          """)
        end
      )

      execute("""
      INSERT INTO platform_agent_jobs (
        agent_id,
        external_job_id,
        title,
        summary,
        status,
        requested_by,
        public_result,
        completed_at,
        created_at,
        updated_at
      )
      SELECT
        id,
        '#{agent.slug}-job-001',
        '#{agent.artifact_title}',
        '#{String.replace(agent.artifact_summary, "'", "''")}',
        'completed',
        'regents.sh',
        true,
        '#{timestamp}',
        '#{timestamp}',
        '#{timestamp}'
      FROM platform_agents
      WHERE slug = '#{agent.slug}'
        AND NOT EXISTS (
          SELECT 1 FROM platform_agent_jobs WHERE external_job_id = '#{agent.slug}-job-001'
        )
      """)

      execute("""
      INSERT INTO platform_agent_artifacts (
        agent_id,
        job_id,
        title,
        summary,
        url,
        visibility,
        published_at,
        created_at,
        updated_at
      )
      SELECT
        agent.id,
        job.id,
        '#{agent.artifact_title}',
        '#{String.replace(agent.artifact_summary, "'", "''")}',
        'https://#{agent.slug}.regents.sh',
        'public',
        '#{timestamp}',
        '#{timestamp}',
        '#{timestamp}'
      FROM platform_agents AS agent
      JOIN platform_agent_jobs AS job ON job.agent_id = agent.id
      WHERE agent.slug = '#{agent.slug}'
        AND job.external_job_id = '#{agent.slug}-job-001'
        AND NOT EXISTS (
          SELECT 1 FROM platform_agent_artifacts
          WHERE title = '#{agent.artifact_title}' AND agent_id = agent.id
        )
      """)
    end)
  end

  def down do
    execute("DELETE FROM platform_agent_artifacts")
    execute("DELETE FROM platform_agent_jobs")
    execute("DELETE FROM platform_agent_connections")
    execute("DELETE FROM platform_agent_services")
    execute("DELETE FROM platform_agent_subdomains")
    execute("DELETE FROM platform_agents")
  end
end
