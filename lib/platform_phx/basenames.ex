defmodule PlatformPhx.Basenames do
  @moduledoc false

  import Ecto.Query, warn: false

  alias PlatformPhx.Basenames.Mint
  alias PlatformPhx.Basenames.MintAllowance
  alias PlatformPhx.Basenames.PaymentCredit
  alias PlatformPhx.Ethereum
  alias PlatformPhx.HttpError
  alias PlatformPhx.Repo
  alias PlatformPhx.RuntimeConfig

  @reserved_labels [
    "_blue",
    "blue",
    "blue_onchain",
    "agent",
    "chainagent",
    "agentchain",
    "agenteval",
    "agentprotocol",
    "agentsea",
    "agents",
    "agentworkers",
    "admin",
    "administrator",
    "animata",
    "architect",
    "assist",
    "base",
    "bio",
    "brennan",
    "companion",
    "env",
    "environments",
    "erc8004",
    "eth",
    "ethereum",
    "eval",
    "evals",
    "expert",
    "glaive",
    "highpass",
    "identity",
    "lead",
    "mcp",
    "ngrave",
    "nft",
    "polyagent",
    "pubchain",
    "qr",
    "qrpay",
    "regent",
    "regentcx",
    "regents",
    "rep",
    "reputation",
    "sean",
    "seanwbren",
    "scion",
    "stabledata",
    "test",
    "x402",
    "xmtp",
    "402",
    "8004"
  ]

  @zero_address "0x0000000000000000000000000000000000000000"
  @base_chain_id 8453
  @ethereum_chain_id 1
  @max_signature_age_ms 60 * 60 * 1000

  def config_payload do
    parent_name = parent_name()
    ens_parent_name = ens_parent_name()

    %{
      "chainId" => @base_chain_id,
      "parentName" => parent_name,
      "parentNode" => namehash!(parent_name),
      "registryAddress" => RuntimeConfig.basenames_registry_address(),
      "l2ResolverAddress" => RuntimeConfig.basenames_l2_resolver_address(),
      "ensChainId" => @ethereum_chain_id,
      "ensParentName" => ens_parent_name,
      "ensParentNode" => namehash!(ens_parent_name),
      "ensRegistryAddress" => RuntimeConfig.ens_registry_address(),
      "ensResolverAddress" => RuntimeConfig.ens_public_resolver_address(),
      "priceWei" => RuntimeConfig.basenames_price_wei(),
      "paymentRecipient" => RuntimeConfig.basenames_payment_recipient(),
      "dbEnabled" => repo_enabled?(),
      "mintingEnabled" => repo_enabled?(),
      "ensMintingEnabled" => repo_enabled?()
    }
  end

  def allowance_payload(address) do
    ensure_repo_enabled!()
    normalized = Ethereum.normalize_address(address) || raise ArgumentError, "Invalid address"
    parent_node = parent_node()

    allowance =
      Repo.one(
        from allowance in MintAllowance,
          where: allowance.parent_node == ^parent_node and allowance.address == ^normalized,
          limit: 1
      )

    snapshot_total = (allowance && allowance.snapshot_total) || 0
    free_mints_used = (allowance && allowance.free_mints_used) || 0

    %{
      "parentName" => parent_name(),
      "parentNode" => parent_node,
      "address" => normalized,
      "snapshotTotal" => snapshot_total,
      "freeMintsUsed" => free_mints_used,
      "freeMintsRemaining" => max(snapshot_total - free_mints_used, 0)
    }
  end

  def allowances_payload do
    ensure_repo_enabled!()
    current_parent_name = parent_name()
    current_parent_node = parent_node()

    allowances =
      from(allowance in MintAllowance,
        where: allowance.parent_node == ^current_parent_node,
        order_by: [
          desc: allowance.snapshot_total,
          desc: allowance.free_mints_used,
          asc: allowance.address
        ],
        select: %{
          "address" => allowance.address,
          "snapshotTotal" => allowance.snapshot_total,
          "freeMintsUsed" => allowance.free_mints_used
        }
      )
      |> Repo.all()
      |> Enum.map(fn row ->
        Map.put(row, "freeMintsRemaining", max(row["snapshotTotal"] - row["freeMintsUsed"], 0))
      end)

    %{
      "parentName" => current_parent_name,
      "parentNode" => current_parent_node,
      "totalAddresses" => length(allowances),
      "allowances" => allowances
    }
  end

  def recent_payload(limit \\ 12) do
    ensure_repo_enabled!()
    bounded_limit = min(max(limit, 1), 50)

    names =
      from(mint in Mint,
        order_by: [desc: mint.inserted_at],
        limit: ^bounded_limit,
        select: %{
          "label" => mint.label,
          "fqdn" => mint.fqdn,
          "createdAt" => mint.inserted_at
        }
      )
      |> Repo.all()
      |> Enum.map(&iso_datetime_fields(&1, ["createdAt"]))

    %{"names" => names}
  end

  def owned_payload(address) do
    ensure_repo_enabled!()
    normalized = Ethereum.normalize_address(address) || raise ArgumentError, "Invalid address"

    names =
      from(mint in Mint,
        where: mint.owner_address == ^normalized,
        order_by: [desc: mint.inserted_at],
        select: %{
          "label" => mint.label,
          "fqdn" => mint.fqdn,
          "ensFqdn" => mint.ens_fqdn,
          "ensTxHash" => mint.ens_tx_hash,
          "isFree" => mint.is_free,
          "isInUse" => mint.is_in_use,
          "createdAt" => mint.inserted_at
        }
      )
      |> Repo.all()
      |> Enum.map(fn row ->
        row
        |> Map.put("label", resolve_label(row["label"], row["fqdn"]))
        |> Map.put("ensFqdn", blank_to_nil(row["ensFqdn"]))
        |> iso_datetime_fields(["createdAt"])
      end)
      |> Enum.reject(&(&1["label"] in [nil, ""]))

    %{"address" => normalized, "names" => names}
  end

  def credits_payload(address) do
    ensure_repo_enabled!()
    normalized = Ethereum.normalize_address(address) || raise ArgumentError, "Invalid address"
    current_parent_name = parent_name()
    current_parent_node = parent_node()

    credits =
      from(credit in PaymentCredit,
        where:
          credit.parent_node == ^current_parent_node and credit.address == ^normalized and
            is_nil(credit.consumed_at),
        order_by: [asc: credit.inserted_at],
        select: %{
          "id" => credit.id,
          "paymentTxHash" => credit.payment_tx_hash,
          "priceWei" => credit.price_wei,
          "createdAt" => credit.inserted_at
        }
      )
      |> Repo.all()
      |> Enum.map(fn row ->
        row
        |> Map.update!("priceWei", &Integer.to_string/1)
        |> iso_datetime_fields(["createdAt"])
      end)

    %{
      "parentName" => current_parent_name,
      "parentNode" => current_parent_node,
      "address" => normalized,
      "availableCredits" => length(credits),
      "credits" => credits
    }
  end

  def availability_payload(label) do
    ensure_repo_enabled!()
    validation = validate_label(label)

    if validation.is_valid do
      parent_name = parent_name()
      fqdn = to_subname_fqdn(validation.normalized_label, parent_name)
      node = namehash!(fqdn)
      ens_parent_name = ens_parent_name()
      ens_fqdn = to_subname_fqdn(validation.normalized_label, ens_parent_name)
      ens_node = namehash!(ens_fqdn)
      reserved = reserved_label?(validation.normalized_label)

      if reserved do
        %{
          "parentName" => parent_name,
          "label" => validation.normalized_label,
          "fqdn" => fqdn,
          "node" => node,
          "owner" => @zero_address,
          "available" => false,
          "basenamesAvailable" => false,
          "ensParentName" => ens_parent_name,
          "ensFqdn" => ens_fqdn,
          "ensNode" => ens_node,
          "ensOwner" => @zero_address,
          "ensAvailable" => false,
          "reserved" => true
        }
      else
        owner =
          from(mint in Mint,
            where: mint.node == ^node or mint.ens_node == ^ens_node,
            limit: 1,
            select: mint.owner_address
          )
          |> Repo.one()

        available = is_nil(owner)
        owner_address = owner || @zero_address

        %{
          "parentName" => parent_name,
          "label" => validation.normalized_label,
          "fqdn" => fqdn,
          "node" => node,
          "owner" => owner_address,
          "ensParentName" => ens_parent_name,
          "ensFqdn" => ens_fqdn,
          "ensNode" => ens_node,
          "ensOwner" => owner_address,
          "available" => available,
          "basenamesAvailable" => available,
          "ensAvailable" => available,
          "reserved" => false
        }
      end
    else
      raise ArgumentError, validation.reason
    end
  end

  def mint!(params) do
    ensure_repo_enabled!()

    normalized_address =
      Ethereum.normalize_address(params["address"]) || raise ArgumentError, "Invalid address"

    validation = validate_label(params["label"] || "")

    if not validation.is_valid do
      raise ArgumentError, validation.reason
    end

    if reserved_label?(validation.normalized_label) do
      raise_http(409, "Name is reserved")
    end

    timestamp = parse_timestamp!(params["timestamp"])
    validate_signature_age!(timestamp)

    signature = trim_binary(params["signature"]) || raise ArgumentError, "Missing signature"
    parent_name = parent_name()
    parent_node = parent_node()
    fqdn = to_subname_fqdn(validation.normalized_label, parent_name)
    node = namehash!(fqdn)
    ens_parent_name = ens_parent_name()
    ens_fqdn = to_subname_fqdn(validation.normalized_label, ens_parent_name)
    ens_node = namehash!(ens_fqdn)

    message = create_mint_message(normalized_address, fqdn, @base_chain_id, timestamp)
    :ok = Ethereum.verify_signature!(normalized_address, message, signature)

    existing =
      from(mint in Mint,
        where: mint.node == ^node or mint.ens_node == ^ens_node,
        limit: 1,
        select: mint.id
      )
      |> Repo.one()

    if existing do
      raise_http(409, "Name already taken")
    end

    should_use_credit = truthy?(params["useCredit"])
    payment_tx_hash = params["paymentTxHash"]
    payment_chain_id = integer_or_nil(params["paymentChainId"])

    Repo.transaction(fn ->
      reservation =
        cond do
          is_binary(payment_tx_hash) and Ethereum.valid_tx_hash?(payment_tx_hash) ->
            reserve_payment_credit!(
              normalized_address,
              parent_node,
              parent_name,
              String.downcase(String.trim(payment_tx_hash)),
              payment_chain_id
            )

          should_use_credit ->
            reserve_oldest_credit!(normalized_address, parent_node)

          true ->
            reserve_free_or_credit!(normalized_address, parent_node)
        end

      tx_hash =
        synthetic_mint_tx_hash(normalized_address, validation.normalized_label, timestamp)

      {:ok, mint} =
        %Mint{}
        |> Ecto.Changeset.change(%{
          parent_node: parent_node,
          parent_name: parent_name,
          label: validation.normalized_label,
          fqdn: fqdn,
          node: node,
          ens_fqdn: ens_fqdn,
          ens_node: ens_node,
          owner_address: normalized_address,
          tx_hash: tx_hash,
          payment_tx_hash: reservation.payment_tx_hash,
          payment_chain_id: reservation.payment_chain_id,
          price_wei: reservation.price_wei,
          is_free: reservation.is_free
        })
        |> Repo.insert()

      if reservation.credit_id do
        from(credit in PaymentCredit, where: credit.id == ^reservation.credit_id)
        |> Repo.update_all(set: [consumed_node: node, consumed_fqdn: fqdn])
      end

      %{
        "ok" => true,
        "fqdn" => fqdn,
        "ensFqdn" => ens_fqdn,
        "label" => validation.normalized_label,
        "txHash" => mint.tx_hash,
        "ensTxHash" => nil,
        "isFree" => reservation.is_free,
        "priceWei" => Integer.to_string(reservation.price_wei)
      }
    end)
    |> case do
      {:ok, payload} ->
        payload

      {:error, %HttpError{} = error} ->
        raise error

      {:error, reason} when is_binary(reason) ->
        raise ArgumentError, reason

      {:error, %Ecto.Changeset{errors: errors}} ->
        raise ArgumentError, format_changeset_errors(errors)

      {:error, reason} ->
        raise ArgumentError, inspect(reason)
    end
  end

  def credit!(params) do
    ensure_repo_enabled!()

    normalized_address =
      Ethereum.normalize_address(params["address"]) || raise ArgumentError, "Invalid address"

    payment_tx_hash =
      trim_binary(params["paymentTxHash"]) || raise ArgumentError, "Invalid payment tx hash"

    if not Ethereum.valid_tx_hash?(payment_tx_hash) do
      raise ArgumentError, "Invalid payment tx hash"
    end

    payment_chain_id = integer_or_nil(params["paymentChainId"])
    current_parent_name = parent_name()
    current_parent_node = parent_node()

    payment =
      verify_payment!(
        normalized_address,
        String.downcase(payment_tx_hash),
        payment_chain_id
      )

    existing =
      from(credit in PaymentCredit,
        where:
          credit.payment_tx_hash == ^payment.payment_tx_hash and
            credit.payment_chain_id == ^payment.payment_chain_id,
        limit: 1
      )
      |> Repo.one()

    credit =
      if is_nil(existing) do
        {:ok, inserted} =
          %PaymentCredit{}
          |> Ecto.Changeset.change(%{
            parent_node: current_parent_node,
            parent_name: current_parent_name,
            address: normalized_address,
            payment_tx_hash: payment.payment_tx_hash,
            payment_chain_id: payment.payment_chain_id,
            price_wei: payment.price_wei
          })
          |> Repo.insert()

        inserted
      else
        existing
      end

    if credit.address != normalized_address do
      raise_http(400, "Payment tx already registered to another address")
    end

    if credit.consumed_at do
      raise_http(409, "Payment already used")
    end

    %{
      "ok" => true,
      "creditId" => credit.id,
      "paymentTxHash" => payment.payment_tx_hash,
      "available" => is_nil(credit.consumed_at)
    }
  end

  def use!(params) do
    ensure_repo_enabled!()

    normalized_address =
      Ethereum.normalize_address(params["address"]) || raise ArgumentError, "Invalid address"

    raw_label = trim_binary(params["label"]) || raise ArgumentError, "Missing label"
    validation = validate_label(raw_label)

    if not validation.is_valid do
      raise ArgumentError, validation.reason
    end

    current_parent_name = parent_name()
    current_parent_node = parent_node()
    fqdn = to_subname_fqdn(validation.normalized_label, current_parent_name)
    node = namehash!(fqdn)
    is_random = truthy?(params["isRandom"])

    existing =
      from(mint in Mint,
        where: mint.node == ^node,
        limit: 1,
        select: %{
          id: mint.id,
          owner_address: mint.owner_address,
          fqdn: mint.fqdn,
          label: mint.label,
          is_in_use: mint.is_in_use
        }
      )
      |> Repo.one()

    cond do
      is_random and is_nil(existing) ->
        tx_hash = synthetic_creator_tx_hash(normalized_address, validation.normalized_label)

        {:ok, mint} =
          %Mint{}
          |> Ecto.Changeset.change(%{
            parent_node: current_parent_node,
            parent_name: current_parent_name,
            label: validation.normalized_label,
            fqdn: fqdn,
            node: node,
            owner_address: normalized_address,
            tx_hash: tx_hash,
            is_free: true,
            is_in_use: true
          })
          |> Repo.insert()

        %{
          "ok" => true,
          "label" => mint.label,
          "fqdn" => mint.fqdn,
          "isInUse" => true,
          "existed" => false
        }

      is_random and existing.owner_address != normalized_address ->
        raise_http(409, "Name already claimed")

      is_random ->
        maybe_mark_in_use(existing.id, existing.is_in_use, normalized_address)

        %{
          "ok" => true,
          "label" => existing.label,
          "fqdn" => existing.fqdn,
          "isInUse" => true,
          "existed" => true
        }

      is_nil(existing) ->
        raise_http(404, "Name not found")

      existing.owner_address != normalized_address ->
        raise_http(403, "Name not owned by wallet")

      true ->
        maybe_mark_in_use(existing.id, existing.is_in_use, normalized_address)

        %{
          "ok" => true,
          "label" => existing.label,
          "fqdn" => existing.fqdn,
          "isInUse" => true,
          "existed" => true
        }
    end
  end

  def create_mint_message(address, fqdn, chain_id, timestamp) do
    [
      "Regent Basenames Mint",
      "Address: #{String.downcase(address)}",
      "Name: #{String.downcase(fqdn)}",
      "ChainId: #{chain_id}",
      "Timestamp: #{timestamp}"
    ]
    |> Enum.join("\n")
  end

  def validate_label(raw_label) do
    normalized_label = raw_label |> to_string() |> String.trim() |> String.downcase()

    cond do
      normalized_label == "" ->
        %{is_valid: false, normalized_label: normalized_label, reason: "Missing name"}

      String.length(normalized_label) < 3 or String.length(normalized_label) > 15 ->
        %{
          is_valid: false,
          normalized_label: normalized_label,
          reason: "Name must be 3-15 characters"
        }

      not Regex.match?(~r/^[a-z0-9]+$/, normalized_label) ->
        %{
          is_valid: false,
          normalized_label: normalized_label,
          reason: "Use only lowercase letters and numbers"
        }

      Regex.match?(~r/^\d+$/, normalized_label) and String.to_integer(normalized_label) <= 10_000 ->
        %{
          is_valid: false,
          normalized_label: normalized_label,
          reason: "Numeric names 0-10000 are not allowed"
        }

      true ->
        %{is_valid: true, normalized_label: normalized_label}
    end
  end

  def to_subname_fqdn(label, parent_name) do
    "#{String.downcase(String.trim(label))}.#{String.downcase(String.trim(parent_name))}"
  end

  def reserved_label?(label) do
    label
    |> String.trim()
    |> String.downcase()
    |> then(&(&1 in @reserved_labels))
  end

  def parent_name, do: String.downcase(RuntimeConfig.basename_parent_name())
  def ens_parent_name, do: String.downcase(RuntimeConfig.ens_parent_name())
  def parent_node, do: namehash!(parent_name())
  def repo_enabled?, do: not is_nil(Repo.config()[:database]) or not is_nil(Repo.config()[:url])

  defp reserve_free_or_credit!(address, parent_node) do
    case reserve_free_mint(address, parent_node) do
      {:free, price_wei} ->
        %{
          is_free: true,
          price_wei: price_wei,
          payment_tx_hash: nil,
          payment_chain_id: nil,
          credit_id: nil
        }

      :none ->
        reserve_oldest_credit!(address, parent_node)
    end
  end

  defp reserve_free_mint(address, parent_node) do
    {count, _} =
      from(allowance in MintAllowance,
        where:
          allowance.parent_node == ^parent_node and allowance.address == ^address and
            allowance.free_mints_used < allowance.snapshot_total
      )
      |> Repo.update_all(
        inc: [free_mints_used: 1],
        set: [updated_at: DateTime.utc_now()]
      )

    if count > 0, do: {:free, 0}, else: :none
  end

  defp reserve_oldest_credit!(address, parent_node) do
    credit =
      from(credit in PaymentCredit,
        where:
          credit.parent_node == ^parent_node and credit.address == ^address and
            is_nil(credit.consumed_at),
        order_by: [asc: credit.inserted_at],
        limit: 1
      )
      |> Repo.one()

    if is_nil(credit) do
      raise_http(402, "Payment required (no free mints or credits remaining)")
    end

    {count, _} =
      from(row in PaymentCredit, where: row.id == ^credit.id and is_nil(row.consumed_at))
      |> Repo.update_all(set: [consumed_at: DateTime.utc_now()])

    if count == 0 do
      raise_http(409, "Payment already used")
    end

    %{
      is_free: false,
      price_wei: credit.price_wei,
      payment_tx_hash: credit.payment_tx_hash,
      payment_chain_id: credit.payment_chain_id,
      credit_id: credit.id
    }
  end

  defp reserve_payment_credit!(
         address,
         parent_node,
         parent_name,
         payment_tx_hash,
         payment_chain_id
       ) do
    payment = verify_payment!(address, payment_tx_hash, payment_chain_id)

    credit =
      from(existing in PaymentCredit,
        where:
          existing.payment_tx_hash == ^payment.payment_tx_hash and
            existing.payment_chain_id == ^payment.payment_chain_id,
        limit: 1
      )
      |> Repo.one()

    credit =
      if is_nil(credit) do
        {:ok, new_credit} =
          %PaymentCredit{}
          |> Ecto.Changeset.change(%{
            parent_node: parent_node,
            parent_name: parent_name,
            address: address,
            payment_tx_hash: payment.payment_tx_hash,
            payment_chain_id: payment.payment_chain_id,
            price_wei: payment.price_wei
          })
          |> Repo.insert()

        new_credit
      else
        credit
      end

    if credit.address != address do
      raise_http(400, "Payment tx already registered to another address")
    end

    if credit.consumed_at do
      raise_http(409, "Payment already used")
    end

    {count, _} =
      from(row in PaymentCredit, where: row.id == ^credit.id and is_nil(row.consumed_at))
      |> Repo.update_all(set: [consumed_at: DateTime.utc_now()])

    if count == 0 do
      raise_http(409, "Payment already used")
    end

    %{
      is_free: false,
      price_wei: payment.price_wei,
      payment_tx_hash: payment.payment_tx_hash,
      payment_chain_id: payment.payment_chain_id,
      credit_id: credit.id
    }
  end

  defp verify_payment!(address, payment_tx_hash, payment_chain_id) do
    recipient =
      RuntimeConfig.basenames_payment_recipient() ||
        raise_http(503, "Server missing AGENT_BASENAME_PAYMENT_RECIPIENT (paid mints disabled)")

    price_wei = String.to_integer(RuntimeConfig.basenames_price_wei())

    targets =
      case payment_chain_id do
        @base_chain_id ->
          [{@base_chain_id, RuntimeConfig.base_rpc_url()}]

        @ethereum_chain_id ->
          [{@ethereum_chain_id, RuntimeConfig.ethereum_rpc_url()}]

        nil ->
          [
            {@base_chain_id, RuntimeConfig.base_rpc_url()},
            {@ethereum_chain_id, RuntimeConfig.ethereum_rpc_url()}
          ]

        _ ->
          raise_http(400, "Unsupported payment chain")
      end
      |> Enum.reject(fn {_chain_id, rpc_url} -> is_nil(rpc_url) end)

    if Enum.empty?(targets) do
      raise_http(500, "Server missing RPC URL(s)")
    end

    Enum.find_value(targets, fn {chain_id, rpc_url} ->
      with {:ok, tx} <- Ethereum.json_rpc(rpc_url, "eth_getTransactionByHash", [payment_tx_hash]),
           false <- is_nil(tx),
           {:ok, receipt} <-
             Ethereum.json_rpc(rpc_url, "eth_getTransactionReceipt", [payment_tx_hash]),
           false <- is_nil(receipt) do
        from = Ethereum.normalize_address(tx["from"]) || ""
        to = Ethereum.normalize_address(tx["to"]) || ""
        value = Ethereum.hex_to_integer(tx["value"])
        status = String.downcase(receipt["status"] || "")

        cond do
          from != address ->
            raise_http(400, "Payment tx from does not match")

          to != String.downcase(recipient) ->
            raise_http(400, "Payment recipient mismatch")

          value < price_wei ->
            raise_http(400, "Payment amount too low")

          status != "0x1" ->
            raise_http(400, "Payment tx not successful")

          true ->
            %{
              payment_tx_hash: payment_tx_hash,
              payment_chain_id: chain_id,
              price_wei: value
            }
        end
      else
        {:error, _message} -> nil
        true -> nil
      end
    end) || raise_http(400, "Payment tx not found on Base or Ethereum")
  end

  defp ensure_repo_enabled! do
    if not repo_enabled?() do
      raise_http(503, "Server missing DATABASE_URL (basenames DB disabled)")
    end
  end

  defp parse_timestamp!(value) when is_integer(value), do: value

  defp parse_timestamp!(value) when is_binary(value) and value != "" do
    String.to_integer(value)
  rescue
    ArgumentError -> raise ArgumentError, "Missing timestamp"
  end

  defp parse_timestamp!(_value), do: raise(ArgumentError, "Missing timestamp")

  defp validate_signature_age!(timestamp) do
    now = System.system_time(:millisecond)

    if abs(now - timestamp) > @max_signature_age_ms do
      raise ArgumentError, "Signature expired"
    end
  end

  defp maybe_mark_in_use(_id, true, _address), do: :ok

  defp maybe_mark_in_use(id, false, address) do
    from(mint in Mint, where: mint.id == ^id and mint.owner_address == ^address)
    |> Repo.update_all(set: [is_in_use: true])

    :ok
  end

  defp synthetic_mint_tx_hash(address, label, timestamp) do
    Ethereum.synthetic_tx_hash("mint:#{address}:#{label}:#{timestamp}")
  end

  defp synthetic_creator_tx_hash(address, label) do
    Ethereum.synthetic_tx_hash("creator:#{address}:#{label}")
  end

  defp raise_http(status, message) do
    raise HttpError, status: status, message: message
  end

  defp resolve_label(label, fqdn) do
    direct = trim_and_strip_dots(label)

    if direct != "" do
      direct
    else
      fqdn
      |> to_string()
      |> String.split(".")
      |> Enum.map(&trim_and_strip_dots/1)
      |> Enum.reject(&(&1 == ""))
      |> List.first()
      |> blank_to_nil()
    end
  end

  defp trim_and_strip_dots(nil), do: ""
  defp trim_and_strip_dots(value), do: value |> to_string() |> String.trim() |> String.trim(".")

  defp blank_to_nil(nil), do: nil

  defp blank_to_nil(value) when is_binary(value) do
    trimmed = String.trim(value)
    if trimmed == "", do: nil, else: trimmed
  end

  defp truthy?(value) when value in [true, "true", "1", 1, "yes", "on"], do: true
  defp truthy?(_value), do: false

  defp integer_or_nil(nil), do: nil
  defp integer_or_nil(value) when is_integer(value), do: value
  defp integer_or_nil(value) when is_binary(value) and value != "", do: String.to_integer(value)
  defp integer_or_nil(_value), do: nil

  defp iso_datetime_fields(map, keys) do
    Enum.reduce(keys, map, fn key, acc ->
      case acc[key] do
        %DateTime{} = value ->
          Map.put(acc, key, DateTime.to_iso8601(value))

        %NaiveDateTime{} = value ->
          Map.put(acc, key, value |> DateTime.from_naive!("Etc/UTC") |> DateTime.to_iso8601())

        _ ->
          acc
      end
    end)
  end

  defp namehash!(name), do: Ethereum.namehash!(name)

  defp trim_binary(value) when is_binary(value) do
    trimmed = String.trim(value)
    if trimmed == "", do: nil, else: trimmed
  end

  defp trim_binary(_value), do: nil

  defp format_changeset_errors(errors) do
    errors
    |> Enum.map(fn {field, {message, _opts}} -> "#{field} #{message}" end)
    |> Enum.join(", ")
  end
end
