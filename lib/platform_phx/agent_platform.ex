defmodule PlatformPhx.AgentPlatform do
  @moduledoc false

  import Ecto.Query, warn: false

  alias PlatformPhx.Accounts.HumanUser
  alias PlatformPhx.AgentPlatform.Agent
  alias PlatformPhx.AgentPlatform.Artifact
  alias PlatformPhx.AgentPlatform.Connection
  alias PlatformPhx.AgentPlatform.Service
  alias PlatformPhx.AgentPlatform.Subdomain
  alias PlatformPhx.AgentPlatform.TemplateCatalog
  alias PlatformPhx.Basenames.Mint
  alias PlatformPhx.OpenSea
  alias PlatformPhx.Repo

  @default_template_key "start"
  @default_sprite_owner "regents"
  @default_hermes_model "glm-5.1"

  @type error_reason ::
          {:bad_request, String.t()}
          | {:forbidden, String.t()}
          | {:not_found, String.t()}
          | {:conflict, String.t()}
          | {:unauthorized, String.t()}
          | {:payment_required, String.t()}
          | {:unavailable, String.t()}
          | {:external, atom(), String.t()}

  def list_templates, do: TemplateCatalog.list()

  def get_template(key), do: TemplateCatalog.get(key)

  def current_human_payload(nil) do
    {:ok,
     %{
       ok: true,
       authenticated: false,
       human: nil,
       claimed_names: [],
       agents: []
     }}
  end

  def current_human_payload(%HumanUser{} = human) do
    {:ok,
     %{
       ok: true,
       authenticated: true,
       human: serialize_human(human),
       claimed_names: claimed_names_for_human(human),
       agents: Enum.map(list_owned_agents(human), &serialize_agent(&1, :private))
     }}
  end

  def wizard_payload(nil) do
    {:ok,
     %{
       ok: true,
       authenticated: false,
       wallet_address: nil,
       eligible: false,
       collections: empty_holdings(),
       claimed_names: [],
       available_claims: [],
       llm_billing: llm_billing_payload(nil, nil),
       credits: empty_credit_summary(),
       owned_companies: []
     }}
  end

  def wizard_payload(%HumanUser{} = human) do
    with {:ok, holdings} <- holdings_for_human(human) do
      claimed_names = claimed_names_for_human(human)

      {:ok,
       %{
         ok: true,
         authenticated: true,
         wallet_address: current_wallet_address(human),
         eligible: eligible_holdings?(holdings),
         collections: holdings,
         claimed_names: claimed_names,
         available_claims: Enum.reject(claimed_names, & &1.in_use),
         llm_billing:
           llm_billing_payload(human.stripe_llm_billing_status, human.stripe_llm_external_ref),
         credits: credit_summary_map(human),
         owned_companies: Enum.map(list_owned_agents(human), &serialize_agent(&1, :private))
       }}
    end
  end

  def create_llm_billing_session(nil),
    do: {:error, {:unauthorized, "Sign in before connecting Stripe LLM billing"}}

  def create_llm_billing_session(%HumanUser{} = human) do
    external_ref = human.stripe_llm_external_ref || "stripe-llm-human-#{human.id}"

    human
    |> HumanUser.changeset(%{
      stripe_llm_billing_status: "connected",
      stripe_llm_external_ref: external_ref
    })
    |> Repo.update()
    |> case do
      {:ok, updated_human} ->
        {:ok,
         %{
           ok: true,
           llm_billing:
             llm_billing_payload(
               updated_human.stripe_llm_billing_status,
               updated_human.stripe_llm_external_ref
             )
         }}

      {:error, changeset} ->
        {:error, {:bad_request, format_changeset(changeset)}}
    end
  end

  def credit_summary(nil),
    do: {:error, {:unauthorized, "Sign in before reading Sprite credits"}}

  def credit_summary(%HumanUser{} = human) do
    {:ok, %{ok: true, credits: credit_summary_map(human)}}
  end

  def checkout_credits(nil, _attrs),
    do: {:error, {:unauthorized, "Sign in before adding Sprite credits"}}

  def checkout_credits(%HumanUser{} = human, attrs) when is_map(attrs) do
    with slug when is_binary(slug) <- normalize_slug(Map.get(attrs, "slug")),
         amount when is_integer(amount) and amount > 0 <-
           normalize_positive_integer(Map.get(attrs, "amountUsdCents")),
         %Agent{} = agent <- get_owned_agent(human, slug),
         {:ok, _updated} <-
           agent
           |> Agent.changeset(%{
             sprite_credit_balance_usd_cents:
               (agent.sprite_credit_balance_usd_cents || 0) + amount,
             sprite_metering_status: "paid"
           })
           |> Repo.update() do
      reloaded = get_owned_agent(human, slug)

      {:ok,
       %{ok: true, agent: serialize_agent(reloaded, :private), credits: credit_summary_map(human)}}
    else
      nil ->
        {:error, {:bad_request, "Choose a valid company slug"}}

      false ->
        {:error, {:bad_request, "Amount must be a positive integer"}}

      {:error, changeset} when is_map(changeset) ->
        {:error, {:bad_request, format_changeset(changeset)}}

      {:error, _reason} = error ->
        error

      _other ->
        {:error, {:not_found, "Company not found"}}
    end
  end

  def list_owned_agents(nil), do: []

  def list_owned_agents(%HumanUser{id: id}) do
    Agent
    |> where([agent], agent.owner_human_id == ^id)
    |> order_by([agent], desc: agent.updated_at, asc: agent.slug)
    |> preload([:subdomain, :services, :connections, :artifacts])
    |> Repo.all()
  end

  def list_public_agents do
    Agent
    |> where([agent], agent.status == "published")
    |> order_by([agent], asc: agent.slug)
    |> preload([:subdomain, :services, :connections, :artifacts])
    |> Repo.all()
  end

  def get_public_agent(slug) when is_binary(slug) do
    Agent
    |> where([agent], agent.slug == ^normalize_slug(slug) and agent.status == "published")
    |> preload([:subdomain, :services, :connections, :artifacts])
    |> Repo.one()
  end

  def get_public_agent(_slug), do: nil

  def get_owned_agent(%HumanUser{} = human, slug) when is_binary(slug) do
    Agent
    |> where([agent], agent.owner_human_id == ^human.id and agent.slug == ^normalize_slug(slug))
    |> preload([:subdomain, :services, :connections, :artifacts])
    |> Repo.one()
  end

  def get_owned_agent(_human, _slug), do: nil

  def get_agent_by_host(host) when is_binary(host) do
    host = String.downcase(String.trim(host))

    Repo.one(
      from agent in Agent,
        join: subdomain in assoc(agent, :subdomain),
        where:
          subdomain.hostname == ^host and subdomain.active == true and
            agent.status == "published",
        preload: [:subdomain, :services, :connections, :artifacts]
    )
  end

  def get_agent_by_host(_host), do: nil

  def resolve_host_payload(host) when is_binary(host) do
    case get_agent_by_host(host) do
      %Agent{} = agent -> {:ok, %{ok: true, host: host, agent: serialize_agent(agent, :public)}}
      nil -> {:error, {:not_found, "No published agent matches that host"}}
    end
  end

  def resolve_host_payload(_host), do: {:error, {:bad_request, "Invalid host"}}

  def provision_company(nil, _attrs),
    do: {:error, {:unauthorized, "Sign in before creating a Paperclip-Hermes company"}}

  def provision_company(%HumanUser{} = human, attrs) when is_map(attrs) do
    with :ok <- ensure_wallet_connected(human),
         {:ok, holdings} <- holdings_for_human(human),
         :ok <- ensure_eligible_holdings(holdings),
         :ok <- ensure_llm_billing_connected(human),
         {:ok, template} <- require_customer_template(),
         {:ok, mint} <- require_available_claimed_name(human, attrs),
         false <- slug_taken?(mint.label),
         {:ok, %Agent{} = agent} <- provision_company_record(human, mint, template) do
      reloaded = get_owned_agent(human, agent.slug)

      {:ok,
       %{
         ok: true,
         agent: serialize_agent(reloaded, :private),
         runtime: runtime_payload_map(reloaded)
       }}
    else
      true -> {:error, {:conflict, "That claimed name is already active as a company"}}
      {:error, _reason} = error -> error
    end
  end

  def runtime_payload(nil, _slug),
    do: {:error, {:unauthorized, "Sign in before reading runtime status"}}

  def runtime_payload(%HumanUser{} = human, slug) when is_binary(slug) do
    with %Agent{} = agent <- get_owned_agent(human, slug) do
      {:ok,
       %{ok: true, agent: serialize_agent(agent, :private), runtime: runtime_payload_map(agent)}}
    else
      nil -> {:error, {:not_found, "Company not found"}}
    end
  end

  def feed_payload(slug) when is_binary(slug) do
    case get_public_agent(slug) do
      %Agent{} = agent ->
        {:ok,
         %{
           ok: true,
           agent: %{
             slug: agent.slug,
             name: agent.name
           },
           feed: Enum.map(agent.artifacts, &serialize_artifact/1)
         }}

      nil ->
        {:error, {:not_found, "Agent not found"}}
    end
  end

  def feed_payload(_slug), do: {:error, {:bad_request, "Invalid agent slug"}}

  def claimed_names_for_human(%HumanUser{} = human) do
    wallets = linked_wallet_addresses(human)

    if wallets == [] do
      []
    else
      Mint
      |> where([mint], mint.owner_address in ^wallets)
      |> order_by([mint], desc: mint.created_at, asc: mint.label)
      |> select([mint], %{
        label: mint.label,
        fqdn: mint.fqdn,
        ens_fqdn: mint.ens_fqdn,
        created_at: mint.created_at,
        is_in_use: mint.is_in_use
      })
      |> Repo.all()
      |> Enum.map(fn name ->
        %{
          label: name.label,
          fqdn: name.fqdn,
          ens_fqdn: name.ens_fqdn,
          claimed_at: iso(name.created_at),
          in_use: name.is_in_use
        }
      end)
    end
  end

  def claimed_names_for_human(_human), do: []

  def serialize_agent(agent, scope \\ :private)

  def serialize_agent(%Agent{} = agent, scope) do
    subdomain = subdomain_from_agent(agent)

    base = %{
      id: agent.id,
      owner_human_id: agent.owner_human_id,
      template_key: agent.template_key,
      name: agent.name,
      slug: agent.slug,
      claimed_label: agent.claimed_label,
      basename_fqdn: agent.basename_fqdn,
      ens_fqdn: agent.ens_fqdn,
      status: agent.status,
      public_summary: agent.public_summary,
      hero_statement: agent.hero_statement,
      wallet_address: agent.wallet_address,
      published_at: iso(agent.published_at),
      subdomain:
        if(subdomain,
          do: %{hostname: subdomain.hostname, active: subdomain.active},
          else: nil
        ),
      services: Enum.map(agent.services || [], &serialize_service/1),
      connections: Enum.map(agent.connections || [], &serialize_connection/1),
      feed:
        agent.artifacts
        |> List.wrap()
        |> Enum.filter(&(&1.visibility == "public"))
        |> Enum.map(&serialize_artifact/1)
    }

    case scope do
      :public ->
        base

      _ ->
        Map.merge(base, %{
          sprite_name: agent.sprite_name,
          sprite_url: agent.sprite_url,
          paperclip_url: agent.paperclip_url,
          paperclip_company_id: agent.paperclip_company_id,
          paperclip_agent_id: agent.paperclip_agent_id,
          runtime_status: effective_runtime_status(agent),
          checkpoint_status: agent.checkpoint_status,
          stripe_llm_billing_status: agent.stripe_llm_billing_status,
          stripe_llm_external_ref: agent.stripe_llm_external_ref,
          sprite_free_until: iso(agent.sprite_free_until),
          sprite_credit_balance_usd_cents: agent.sprite_credit_balance_usd_cents || 0,
          sprite_metering_status: effective_metering_status(agent)
        })
    end
  end

  def serialize_agent(nil, _scope), do: nil

  defp serialize_human(%HumanUser{} = human) do
    %{
      id: human.id,
      privy_user_id: human.privy_user_id,
      wallet_address: human.wallet_address,
      wallet_addresses: linked_wallet_addresses(human),
      display_name: human.display_name,
      llm_billing:
        llm_billing_payload(human.stripe_llm_billing_status, human.stripe_llm_external_ref)
    }
  end

  defp serialize_service(%Service{} = service) do
    %{
      slug: service.slug,
      name: service.name,
      summary: service.summary,
      price_label: service.price_label,
      payment_rail: service.payment_rail,
      delivery_mode: service.delivery_mode,
      public_result_default: service.public_result_default,
      sort_order: service.sort_order
    }
  end

  defp serialize_connection(%Connection{} = connection) do
    %{
      kind: connection.kind,
      status: connection.status,
      display_name: connection.display_name,
      external_ref: connection.external_ref,
      details: connection.details || %{},
      connected_at: iso(connection.connected_at)
    }
  end

  defp serialize_artifact(%Artifact{} = artifact) do
    %{
      title: artifact.title,
      summary: artifact.summary,
      url: artifact.url,
      visibility: artifact.visibility,
      published_at: iso(artifact.published_at || artifact.created_at)
    }
  end

  defp provision_company_record(%HumanUser{} = human, %Mint{} = mint, template) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    slug = mint.label
    sprite_url = "https://#{slug}.sprites.dev"

    attrs = %{
      owner_human_id: human.id,
      template_key: template.key,
      name: "#{titleize_slug(slug)} Regent",
      slug: slug,
      claimed_label: slug,
      basename_fqdn: mint.fqdn,
      ens_fqdn: mint.ens_fqdn || "#{slug}.regent.eth",
      status: "published",
      public_summary: template.summary,
      hero_statement: template.hero_statement,
      sprite_name: "#{slug}-sprite",
      sprite_url: sprite_url,
      paperclip_url: "#{sprite_url}:3100",
      paperclip_company_id: "#{slug}-company",
      paperclip_agent_id: "#{slug}-hermes",
      runtime_status: "ready",
      checkpoint_status: "ready",
      stripe_llm_billing_status: "connected",
      stripe_llm_external_ref: human.stripe_llm_external_ref,
      sprite_free_until: DateTime.add(now, 86_400, :second),
      sprite_credit_balance_usd_cents: 0,
      sprite_metering_status: "trialing",
      wallet_address: human.wallet_address,
      published_at: now
    }

    Repo.transaction(fn ->
      with {:ok, agent} <- %Agent{} |> Agent.changeset(attrs) |> Repo.insert(),
           {:ok, _subdomain} <-
             %Subdomain{}
             |> Subdomain.changeset(%{
               agent_id: agent.id,
               slug: slug,
               hostname: "#{slug}.regents.sh",
               basename_fqdn: mint.fqdn,
               ens_fqdn: mint.ens_fqdn || "#{slug}.regent.eth",
               active: true
             })
             |> Repo.insert(),
           {:ok, _mint_count} <- mark_mint_in_use(mint),
           :ok <- insert_default_services(agent, template),
           :ok <- insert_default_connections(agent, template) do
        Repo.preload(agent, [:subdomain, :services, :connections, :artifacts])
      else
        {:error, changeset} when is_map(changeset) ->
          Repo.rollback({:bad_request, format_changeset(changeset)})

        {:error, _reason} = error ->
          Repo.rollback(error)
      end
    end)
  end

  defp insert_default_services(%Agent{} = agent, template) do
    Enum.reduce_while(template.services, :ok, fn service, _acc ->
      attrs = %{
        agent_id: agent.id,
        slug: service.slug,
        name: service.name,
        summary: service.summary,
        price_label: service.price_label,
        payment_rail: service.payment_rail,
        delivery_mode: "async",
        public_result_default: service.public_result_default,
        sort_order: service.sort_order
      }

      case %Service{} |> Service.changeset(attrs) |> Repo.insert() do
        {:ok, _inserted} -> {:cont, :ok}
        {:error, changeset} -> {:halt, {:error, {:bad_request, format_changeset(changeset)}}}
      end
    end)
  end

  defp insert_default_connections(%Agent{} = agent, template) do
    Enum.reduce_while(template.connection_defaults, :ok, fn connection, _acc ->
      attrs = %{
        agent_id: agent.id,
        kind: connection.kind,
        status: connection.status,
        display_name: connection.display_name,
        external_ref: "#{agent.slug}-#{connection.kind}",
        details: %{},
        connected_at:
          if(connection.status == "connected",
            do: DateTime.utc_now() |> DateTime.truncate(:second),
            else: nil
          )
      }

      case %Connection{} |> Connection.changeset(attrs) |> Repo.insert() do
        {:ok, _inserted} -> {:cont, :ok}
        {:error, changeset} -> {:halt, {:error, {:bad_request, format_changeset(changeset)}}}
      end
    end)
  end

  defp mark_mint_in_use(%Mint{} = mint) do
    count =
      from(row in Mint, where: row.id == ^mint.id and row.is_in_use == false)
      |> Repo.update_all(set: [is_in_use: true])
      |> elem(0)

    if count == 1 do
      {:ok, count}
    else
      {:error, {:conflict, "That claimed name is already active as a company"}}
    end
  end

  defp runtime_payload_map(%Agent{} = agent) do
    template = get_template(agent.template_key)
    runtime_defaults = Map.get(template || %{}, :runtime_defaults, %{})

    %{
      sprite: %{
        name: agent.sprite_name,
        url: agent.sprite_url,
        status: effective_runtime_status(agent),
        owner: @default_sprite_owner,
        free_until: iso(agent.sprite_free_until),
        credit_balance_usd_cents: agent.sprite_credit_balance_usd_cents || 0,
        metering_status: effective_metering_status(agent)
      },
      paperclip: %{
        url: agent.paperclip_url,
        company_id: agent.paperclip_company_id,
        status: effective_runtime_status(agent),
        deployment_mode: runtime_defaults[:paperclip_deployment_mode] || "authenticated",
        http_port: runtime_defaults[:paperclip_http_port] || 3100
      },
      hermes: %{
        agent_id: agent.paperclip_agent_id,
        status: effective_runtime_status(agent),
        adapter_type: runtime_defaults[:hermes_adapter_type] || "hermes_local",
        model: runtime_defaults[:hermes_model] || @default_hermes_model,
        persist_session: runtime_defaults[:hermes_persist_session] != false,
        toolsets: runtime_defaults[:hermes_toolsets] || []
      },
      checkpoint: %{
        status: agent.checkpoint_status
      },
      llm_billing:
        llm_billing_payload(agent.stripe_llm_billing_status, agent.stripe_llm_external_ref)
    }
  end

  defp empty_holdings do
    %{
      "animata1" => [],
      "animata2" => [],
      "animataPass" => []
    }
  end

  defp empty_credit_summary do
    %{
      total_balance_usd_cents: 0,
      trialing_companies: 0,
      paid_companies: 0,
      paused_companies: 0,
      companies: []
    }
  end

  defp holdings_for_human(%HumanUser{} = human) do
    case current_wallet_address(human) do
      nil -> {:ok, empty_holdings()}
      wallet_address -> OpenSea.fetch_holdings(wallet_address)
    end
  end

  defp eligible_holdings?(holdings) when is_map(holdings) do
    Enum.any?(["animata1", "animata2", "animataPass"], fn key ->
      holdings
      |> Map.get(key, [])
      |> List.wrap()
      |> Enum.any?()
    end)
  end

  defp eligible_holdings?(_holdings), do: false

  defp ensure_wallet_connected(%HumanUser{} = human) do
    if linked_wallet_addresses(human) == [] do
      {:error, {:bad_request, "Connect a wallet before creating a company"}}
    else
      :ok
    end
  end

  defp ensure_eligible_holdings(holdings) do
    if eligible_holdings?(holdings) do
      :ok
    else
      {:error,
       {:forbidden, "You need Animata I, Regent Animata II, or Regents Club to create a company"}}
    end
  end

  defp ensure_llm_billing_connected(%HumanUser{} = human) do
    if human.stripe_llm_billing_status == "connected" do
      :ok
    else
      {:error, {:payment_required, "Connect Stripe LLM billing before provisioning the company"}}
    end
  end

  defp require_customer_template do
    case get_template(@default_template_key) do
      nil -> {:error, {:unavailable, "Customer start template is missing"}}
      template -> {:ok, template}
    end
  end

  defp require_available_claimed_name(%HumanUser{} = human, attrs) do
    claimed_label =
      attrs
      |> Map.get("claimedLabel")
      |> normalize_slug()

    wallets = linked_wallet_addresses(human)

    cond do
      claimed_label == nil ->
        {:error, {:bad_request, "Claim a name before creating a company"}}

      wallets == [] ->
        {:error, {:bad_request, "Connect a wallet before creating a company"}}

      true ->
        case Repo.one(
               from mint in Mint,
                 where: mint.label == ^claimed_label and mint.owner_address in ^wallets,
                 limit: 1
             ) do
          %Mint{is_in_use: true} ->
            {:error, {:conflict, "That claimed name is already active as a company"}}

          %Mint{} = mint ->
            {:ok, mint}

          nil ->
            {:error, {:forbidden, "That claimed name is not available in your account"}}
        end
    end
  end

  defp llm_billing_payload(status, external_ref) do
    resolved_status = if status == "connected", do: "connected", else: "action_required"

    %{
      status: resolved_status,
      connected: resolved_status == "connected",
      provider: "stripe",
      external_ref: external_ref,
      model_default: @default_hermes_model,
      margin_bps: 0
    }
  end

  defp credit_summary_map(%HumanUser{} = human) do
    companies =
      list_owned_agents(human)
      |> Enum.map(fn agent ->
        %{
          slug: agent.slug,
          name: agent.name,
          runtime_status: effective_runtime_status(agent),
          sprite_metering_status: effective_metering_status(agent),
          sprite_credit_balance_usd_cents: agent.sprite_credit_balance_usd_cents || 0,
          sprite_free_until: iso(agent.sprite_free_until)
        }
      end)

    %{
      total_balance_usd_cents:
        Enum.reduce(companies, 0, fn company, acc ->
          acc + company.sprite_credit_balance_usd_cents
        end),
      trialing_companies: Enum.count(companies, &(&1.sprite_metering_status == "trialing")),
      paid_companies: Enum.count(companies, &(&1.sprite_metering_status == "paid")),
      paused_companies: Enum.count(companies, &(&1.sprite_metering_status == "paused")),
      companies: companies
    }
  end

  defp effective_runtime_status(%Agent{} = agent) do
    if effective_metering_status(agent) == "paused" do
      "paused_for_credits"
    else
      agent.runtime_status
    end
  end

  defp effective_metering_status(%Agent{} = agent) do
    balance = agent.sprite_credit_balance_usd_cents || 0

    cond do
      balance > 0 ->
        "paid"

      is_struct(agent.sprite_free_until, DateTime) and
          DateTime.compare(agent.sprite_free_until, DateTime.utc_now()) == :gt ->
        "trialing"

      true ->
        "paused"
    end
  end

  defp linked_wallet_addresses(%HumanUser{} = human) do
    [human.wallet_address | List.wrap(human.wallet_addresses)]
    |> Enum.map(&normalize_address/1)
    |> Enum.reject(&is_nil/1)
    |> Enum.uniq()
  end

  defp current_wallet_address(%HumanUser{} = human) do
    human
    |> linked_wallet_addresses()
    |> List.first()
  end

  defp subdomain_from_agent(%Agent{subdomain: %Subdomain{} = subdomain}), do: subdomain
  defp subdomain_from_agent(_agent), do: nil

  defp slug_taken?(slug) when is_binary(slug) do
    Repo.exists?(from agent in Agent, where: agent.slug == ^normalize_slug(slug))
  end

  defp slug_taken?(_slug), do: false

  defp titleize_slug(slug) do
    slug
    |> String.split("-")
    |> Enum.reject(&(&1 == ""))
    |> Enum.map_join(" ", &String.capitalize/1)
  end

  defp normalize_positive_integer(value) when is_integer(value) and value > 0, do: value

  defp normalize_positive_integer(value) when is_binary(value) do
    case Integer.parse(String.trim(value)) do
      {parsed, ""} when parsed > 0 -> parsed
      _other -> false
    end
  end

  defp normalize_positive_integer(_value), do: false

  defp normalize_slug(value) when is_binary(value) do
    value
    |> String.trim()
    |> String.downcase()
    |> String.replace(~r/[^a-z0-9-]/u, "-")
    |> String.replace(~r/-+/u, "-")
    |> String.trim("-")
    |> case do
      "" -> nil
      normalized -> normalized
    end
  end

  defp normalize_slug(_value), do: nil

  defp normalize_address(value) when is_binary(value) do
    value
    |> String.trim()
    |> String.downcase()
    |> case do
      "" -> nil
      normalized -> normalized
    end
  end

  defp normalize_address(_value), do: nil

  defp iso(nil), do: nil
  defp iso(%DateTime{} = value), do: DateTime.to_iso8601(value)

  defp format_changeset(changeset) do
    changeset
    |> Ecto.Changeset.traverse_errors(fn {message, opts} ->
      Enum.reduce(opts, message, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
    |> Enum.map(fn {field, messages} -> "#{field} #{Enum.join(messages, ", ")}" end)
    |> Enum.join("; ")
  end
end
