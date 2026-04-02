defmodule PlatformPhx.Basenames.Writes do
  @moduledoc false

  import Ecto.Query, warn: false

  alias PlatformPhx.Basenames
  alias PlatformPhx.Basenames.Mint
  alias PlatformPhx.Basenames.Payments
  alias PlatformPhx.Basenames.Validation
  alias PlatformPhx.Ethereum
  alias PlatformPhx.Repo

  @type result(value) :: Basenames.result(value)

  @spec mint_name(map()) :: result(map())
  def mint_name(params) do
    with :ok <- Payments.ensure_repo_enabled(),
         {:ok, normalized_address} <- Validation.normalize_address(params["address"]),
         {:ok, normalized_label} <- Basenames.validate_label(params["label"] || ""),
         false <- Basenames.reserved_label?(normalized_label),
         {:ok, timestamp} <- Validation.parse_timestamp(params["timestamp"]),
         :ok <- Validation.validate_signature_age(timestamp),
         {:ok, signature} <- Validation.require_nonblank(params["signature"], "Missing signature"),
         {:ok, parent_node} <- Validation.namehash(Basenames.parent_name()) do
      parent_name = Basenames.parent_name()
      fqdn = Basenames.to_subname_fqdn(normalized_label, parent_name)
      ens_parent_name = Basenames.ens_parent_name()
      ens_fqdn = Basenames.to_subname_fqdn(normalized_label, ens_parent_name)

      with {:ok, node} <- Validation.namehash(fqdn),
           {:ok, ens_node} <- Validation.namehash(ens_fqdn),
           :ok <- ensure_name_available(node, ens_node),
           :ok <- verify_signature(normalized_address, fqdn, timestamp, signature) do
        Repo.transaction(fn ->
          with {:ok, reservation} <-
                 Payments.reserve_for_mint(normalized_address, parent_node, parent_name, params),
               {:ok, tx_hash} <-
                 Validation.synthetic_mint_tx_hash(
                   normalized_address,
                   normalized_label,
                   timestamp
                 ),
               {:ok, mint} <-
                 insert_mint(%{
                   parent_node: parent_node,
                   parent_name: parent_name,
                   label: normalized_label,
                   fqdn: fqdn,
                   node: node,
                   ens_fqdn: ens_fqdn,
                   ens_node: ens_node,
                   owner_address: normalized_address,
                   tx_hash: tx_hash,
                   payment_tx_hash: reservation.payment_tx_hash,
                   payment_chain_id: reservation.payment_chain_id,
                   price_wei: reservation.price_wei,
                   is_free: reservation.is_free,
                   is_in_use: false
                 }) do
            :ok = Payments.attach_credit_usage(reservation.credit_id, node, fqdn)

            %{
              "ok" => true,
              "fqdn" => fqdn,
              "ensFqdn" => ens_fqdn,
              "label" => normalized_label,
              "txHash" => mint.tx_hash,
              "ensTxHash" => nil,
              "isFree" => reservation.is_free,
              "priceWei" => Integer.to_string(reservation.price_wei)
            }
          else
            {:error, reason} -> Repo.rollback(reason)
          end
        end)
        |> unwrap_transaction()
      end
    else
      true ->
        {:error, {:conflict, "Name is reserved"}}

      {:error, _reason} = error ->
        error
    end
  end

  @spec mark_in_use(map()) :: result(map())
  def mark_in_use(params) do
    with :ok <- Payments.ensure_repo_enabled(),
         {:ok, normalized_address} <- Validation.normalize_address(params["address"]),
         {:ok, raw_label} <- Validation.require_nonblank(params["label"], "Missing label"),
         {:ok, normalized_label} <- Basenames.validate_label(raw_label),
         {:ok, current_parent_node} <- Validation.namehash(Basenames.parent_name()) do
      current_parent_name = Basenames.parent_name()
      fqdn = Basenames.to_subname_fqdn(normalized_label, current_parent_name)
      is_random = Validation.truthy?(params["isRandom"])

      with {:ok, node} <- Validation.namehash(fqdn) do
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

        handle_mark_in_use(
          existing,
          is_random,
          normalized_address,
          normalized_label,
          fqdn,
          node,
          current_parent_name,
          current_parent_node
        )
      end
    else
      {:error, _reason} = error ->
        error
    end
  end

  defp ensure_name_available(node, ens_node) do
    existing =
      from(mint in Mint,
        where: mint.node == ^node or mint.ens_node == ^ens_node,
        limit: 1,
        select: mint.id
      )
      |> Repo.one()

    if existing, do: {:error, {:conflict, "Name already taken"}}, else: :ok
  end

  defp verify_signature(address, fqdn, timestamp, signature) do
    message = Basenames.create_mint_message(address, fqdn, Basenames.base_chain_id(), timestamp)

    case Ethereum.verify_signature(address, message, signature) do
      :ok -> :ok
      {:error, message} -> {:error, {:bad_request, message}}
    end
  end

  defp insert_mint(attrs) do
    case %Mint{}
         |> Mint.changeset(attrs)
         |> Repo.insert() do
      {:ok, mint} ->
        {:ok, mint}

      {:error, changeset} ->
        if unique_node_conflict?(changeset) do
          {:error, {:conflict, "Name already taken"}}
        else
          if unique_payment_tx_conflict?(changeset) do
            {:error, {:conflict, "Payment already used"}}
          else
            {:error, {:bad_request, Validation.format_changeset_errors(changeset)}}
          end
        end
    end
  end

  defp handle_mark_in_use(
         existing,
         true,
         normalized_address,
         normalized_label,
         fqdn,
         node,
         current_parent_name,
         current_parent_node
       ) do
    cond do
      is_nil(existing) ->
        with {:ok, tx_hash} <-
               Validation.synthetic_creator_tx_hash(normalized_address, normalized_label),
             {:ok, mint} <-
               insert_random_claim(%{
                 parent_node: current_parent_node,
                 parent_name: current_parent_name,
                 label: normalized_label,
                 fqdn: fqdn,
                 node: node,
                 owner_address: normalized_address,
                 tx_hash: tx_hash,
                 is_free: true,
                 is_in_use: true
               }) do
          {:ok,
           %{
             "ok" => true,
             "label" => mint.label,
             "fqdn" => mint.fqdn,
             "isInUse" => true,
             "existed" => false
           }}
        end

      existing.owner_address != normalized_address ->
        {:error, {:conflict, "Name already claimed"}}

      true ->
        maybe_mark_in_use(existing.id, existing.is_in_use, normalized_address)

        {:ok,
         %{
           "ok" => true,
           "label" => existing.label,
           "fqdn" => existing.fqdn,
           "isInUse" => true,
           "existed" => true
         }}
    end
  end

  defp handle_mark_in_use(
         existing,
         false,
         normalized_address,
         _label,
         _fqdn,
         _node,
         _parent_name,
         _parent_node
       ) do
    cond do
      is_nil(existing) ->
        {:error, {:not_found, "Name not found"}}

      existing.owner_address != normalized_address ->
        {:error, {:forbidden, "Name not owned by wallet"}}

      true ->
        maybe_mark_in_use(existing.id, existing.is_in_use, normalized_address)

        {:ok,
         %{
           "ok" => true,
           "label" => existing.label,
           "fqdn" => existing.fqdn,
           "isInUse" => true,
           "existed" => true
         }}
    end
  end

  defp insert_random_claim(attrs) do
    case %Mint{}
         |> Mint.changeset(attrs)
         |> Repo.insert() do
      {:ok, mint} ->
        {:ok, mint}

      {:error, changeset} ->
        if unique_node_conflict?(changeset) do
          {:error, {:conflict, "Name already claimed"}}
        else
          {:error, {:bad_request, Validation.format_changeset_errors(changeset)}}
        end
    end
  end

  defp unique_node_conflict?(changeset) do
    Enum.any?(changeset.errors, fn
      {:node, {"has already been taken", _opts}} -> true
      _ -> false
    end)
  end

  defp unique_payment_tx_conflict?(changeset) do
    Enum.any?(changeset.errors, fn
      {:payment_tx_hash, {"has already been taken", _opts}} -> true
      _ -> false
    end)
  end

  defp maybe_mark_in_use(_id, true, _address), do: :ok

  defp maybe_mark_in_use(id, false, address) do
    from(mint in Mint, where: mint.id == ^id and mint.owner_address == ^address)
    |> Repo.update_all(set: [is_in_use: true])

    :ok
  end

  defp unwrap_transaction({:ok, payload}), do: {:ok, payload}
  defp unwrap_transaction({:error, reason}), do: {:error, reason}
end
