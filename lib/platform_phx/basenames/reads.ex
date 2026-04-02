defmodule PlatformPhx.Basenames.Reads do
  @moduledoc false

  import Ecto.Query, warn: false

  alias PlatformPhx.Basenames
  alias PlatformPhx.Basenames.Mint
  alias PlatformPhx.Basenames.MintAllowance
  alias PlatformPhx.Basenames.PaymentCredit
  alias PlatformPhx.Basenames.Validation
  alias PlatformPhx.Repo
  alias PlatformPhx.RuntimeConfig

  @type result(value) :: Basenames.result(value)

  @spec config_payload() :: result(map())
  def config_payload do
    with {:ok, parent_node} <- Validation.namehash(Basenames.parent_name()),
         {:ok, ens_parent_node} <- Validation.namehash(Basenames.ens_parent_name()) do
      {:ok,
       %{
         "chainId" => Basenames.base_chain_id(),
         "parentName" => Basenames.parent_name(),
         "parentNode" => parent_node,
         "registryAddress" => RuntimeConfig.basenames_registry_address(),
         "l2ResolverAddress" => RuntimeConfig.basenames_l2_resolver_address(),
         "ensChainId" => Basenames.ethereum_chain_id(),
         "ensParentName" => Basenames.ens_parent_name(),
         "ensParentNode" => ens_parent_node,
         "ensRegistryAddress" => RuntimeConfig.ens_registry_address(),
         "ensResolverAddress" => RuntimeConfig.ens_public_resolver_address(),
         "priceWei" => RuntimeConfig.basenames_price_wei(),
         "paymentRecipient" => RuntimeConfig.basenames_payment_recipient(),
         "dbEnabled" => Basenames.repo_enabled?(),
         "mintingEnabled" => Basenames.repo_enabled?(),
         "ensMintingEnabled" => Basenames.repo_enabled?()
       }}
    end
  end

  @spec allowance_payload(term()) :: result(map())
  def allowance_payload(address) do
    with :ok <- ensure_repo_enabled(),
         {:ok, normalized} <- Validation.normalize_address(address),
         {:ok, parent_node} <- Validation.namehash(Basenames.parent_name()) do
      allowance =
        Repo.one(
          from allowance in MintAllowance,
            where: allowance.parent_node == ^parent_node and allowance.address == ^normalized,
            limit: 1
        )

      snapshot_total = if allowance, do: allowance.snapshot_total, else: 0
      free_mints_used = if allowance, do: allowance.free_mints_used, else: 0

      {:ok,
       %{
         "parentName" => Basenames.parent_name(),
         "parentNode" => parent_node,
         "address" => normalized,
         "snapshotTotal" => snapshot_total,
         "freeMintsUsed" => free_mints_used,
         "freeMintsRemaining" => max(snapshot_total - free_mints_used, 0)
       }}
    end
  end

  @spec allowances_payload() :: result(map())
  def allowances_payload do
    with :ok <- ensure_repo_enabled(),
         {:ok, current_parent_node} <- Validation.namehash(Basenames.parent_name()) do
      current_parent_name = Basenames.parent_name()

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

      {:ok,
       %{
         "parentName" => current_parent_name,
         "parentNode" => current_parent_node,
         "totalAddresses" => length(allowances),
         "allowances" => allowances
       }}
    end
  end

  @spec recent_payload(term()) :: result(map())
  def recent_payload(limit \\ 12) do
    with :ok <- ensure_repo_enabled(),
         {:ok, bounded_limit} <- normalize_limit(limit) do
      names =
        from(mint in Mint,
          order_by: [desc: mint.created_at],
          limit: ^bounded_limit,
          select: %{
            "label" => mint.label,
            "fqdn" => mint.fqdn,
            "createdAt" => mint.created_at
          }
        )
        |> Repo.all()
        |> Enum.map(&Validation.iso_datetime_fields(&1, ["createdAt"]))

      {:ok, %{"names" => names}}
    end
  end

  @spec owned_payload(term()) :: result(map())
  def owned_payload(address) do
    with :ok <- ensure_repo_enabled(),
         {:ok, normalized} <- Validation.normalize_address(address) do
      names =
        from(mint in Mint,
          where: mint.owner_address == ^normalized,
          order_by: [desc: mint.created_at],
          select: %{
            "label" => mint.label,
            "fqdn" => mint.fqdn,
            "ensFqdn" => mint.ens_fqdn,
            "ensTxHash" => mint.ens_tx_hash,
            "isFree" => mint.is_free,
            "isInUse" => mint.is_in_use,
            "createdAt" => mint.created_at
          }
        )
        |> Repo.all()
        |> Enum.map(fn row ->
          row
          |> Map.put("label", Validation.resolve_label(row["label"], row["fqdn"]))
          |> Map.put("ensFqdn", Validation.blank_to_nil(row["ensFqdn"]))
          |> Validation.iso_datetime_fields(["createdAt"])
        end)
        |> Enum.reject(&(&1["label"] in [nil, ""]))

      {:ok, %{"address" => normalized, "names" => names}}
    end
  end

  @spec credits_payload(term()) :: result(map())
  def credits_payload(address) do
    with :ok <- ensure_repo_enabled(),
         {:ok, normalized} <- Validation.normalize_address(address),
         {:ok, current_parent_node} <- Validation.namehash(Basenames.parent_name()) do
      current_parent_name = Basenames.parent_name()

      credits =
        from(credit in PaymentCredit,
          where:
            credit.parent_node == ^current_parent_node and credit.address == ^normalized and
              is_nil(credit.consumed_at),
          order_by: [asc: credit.created_at],
          select: %{
            "id" => credit.id,
            "paymentTxHash" => credit.payment_tx_hash,
            "priceWei" => credit.price_wei,
            "createdAt" => credit.created_at
          }
        )
        |> Repo.all()
        |> Enum.map(fn row ->
          row
          |> Map.update!("priceWei", &Integer.to_string/1)
          |> Validation.iso_datetime_fields(["createdAt"])
        end)

      {:ok,
       %{
         "parentName" => current_parent_name,
         "parentNode" => current_parent_node,
         "address" => normalized,
         "availableCredits" => length(credits),
         "credits" => credits
       }}
    end
  end

  @spec availability_payload(term()) :: result(map())
  def availability_payload(label) do
    with :ok <- ensure_repo_enabled(),
         {:ok, normalized_label} <- Basenames.validate_label(label),
         {:ok, node} <-
           Validation.namehash(
             Basenames.to_subname_fqdn(normalized_label, Basenames.parent_name())
           ),
         {:ok, ens_node} <-
           Validation.namehash(
             Basenames.to_subname_fqdn(normalized_label, Basenames.ens_parent_name())
           ) do
      parent_name = Basenames.parent_name()
      fqdn = Basenames.to_subname_fqdn(normalized_label, parent_name)
      ens_parent_name = Basenames.ens_parent_name()
      ens_fqdn = Basenames.to_subname_fqdn(normalized_label, ens_parent_name)

      if Basenames.reserved_label?(normalized_label) do
        {:ok,
         %{
           "parentName" => parent_name,
           "label" => normalized_label,
           "fqdn" => fqdn,
           "node" => node,
           "owner" => Basenames.zero_address(),
           "available" => false,
           "basenamesAvailable" => false,
           "ensParentName" => ens_parent_name,
           "ensFqdn" => ens_fqdn,
           "ensNode" => ens_node,
           "ensOwner" => Basenames.zero_address(),
           "ensAvailable" => false,
           "reserved" => true
         }}
      else
        owner =
          from(mint in Mint,
            where: mint.node == ^node or mint.ens_node == ^ens_node,
            limit: 1,
            select: mint.owner_address
          )
          |> Repo.one()

        owner_address = owner || Basenames.zero_address()
        available = is_nil(owner)

        {:ok,
         %{
           "parentName" => parent_name,
           "label" => normalized_label,
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
         }}
      end
    else
      {:error, _reason} = error -> error
    end
  end

  defp ensure_repo_enabled do
    if Basenames.repo_enabled?() do
      :ok
    else
      {:error, {:unavailable, "Server missing DATABASE_URL (basenames DB disabled)"}}
    end
  end

  defp normalize_limit(nil), do: {:ok, 12}
  defp normalize_limit(limit) when is_integer(limit), do: {:ok, min(max(limit, 1), 50)}

  defp normalize_limit(limit) when is_binary(limit) do
    limit
    |> String.to_integer()
    |> normalize_limit()
  rescue
    ArgumentError -> {:error, {:bad_request, "Invalid limit"}}
  end

  defp normalize_limit(_limit), do: {:error, {:bad_request, "Invalid limit"}}
end
