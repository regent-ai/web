defmodule PlatformPhx.Basenames.Payments do
  @moduledoc false

  import Ecto.Query, warn: false

  alias PlatformPhx.Basenames
  alias PlatformPhx.Basenames.PaymentCredit
  alias PlatformPhx.Basenames.Validation
  alias PlatformPhx.Ethereum
  alias PlatformPhx.Repo
  alias PlatformPhx.RuntimeConfig

  @type result(value) :: Basenames.result(value)
  @type reservation :: %{
          required(:is_free) => boolean(),
          required(:price_wei) => integer(),
          required(:payment_tx_hash) => String.t() | nil,
          required(:payment_chain_id) => integer() | nil,
          required(:credit_id) => integer() | nil
        }
  @type payment :: %{
          required(:payment_tx_hash) => String.t(),
          required(:payment_chain_id) => integer(),
          required(:price_wei) => integer()
        }

  @spec register_credit(map()) :: result(map())
  def register_credit(params) do
    with :ok <- ensure_repo_enabled(),
         {:ok, normalized_address} <- Validation.normalize_address(params["address"]),
         {:ok, payment_tx_hash} <- Validation.validate_payment_tx_hash(params["paymentTxHash"]),
         {:ok, current_parent_node} <- Validation.namehash(Basenames.parent_name()) do
      payment_chain_id = Validation.integer_or_nil(params["paymentChainId"])
      current_parent_name = Basenames.parent_name()

      with {:ok, credit} <-
             fetch_or_register_credit(
               current_parent_node,
               current_parent_name,
               normalized_address,
               payment_tx_hash,
               payment_chain_id
             ),
           :ok <- ensure_credit_owner(credit, normalized_address),
           :ok <- ensure_credit_available(credit) do
        {:ok,
         %{
           "ok" => true,
           "creditId" => credit.id,
           "paymentTxHash" => credit.payment_tx_hash,
           "available" => is_nil(credit.consumed_at)
         }}
      end
    end
  end

  @spec reserve_for_mint(String.t(), String.t(), String.t(), map()) :: result(reservation())
  def reserve_for_mint(address, parent_node, parent_name, params) do
    should_use_credit = Validation.truthy?(params["useCredit"])
    payment_tx_hash = params["paymentTxHash"]
    payment_chain_id = Validation.integer_or_nil(params["paymentChainId"])

    cond do
      is_binary(payment_tx_hash) and String.trim(payment_tx_hash) != "" ->
        with {:ok, normalized_tx_hash} <- Validation.validate_payment_tx_hash(payment_tx_hash) do
          reserve_payment_credit(
            address,
            parent_node,
            parent_name,
            normalized_tx_hash,
            payment_chain_id
          )
        end

      should_use_credit ->
        reserve_oldest_credit(address, parent_node)

      true ->
        reserve_free_or_credit(address, parent_node)
    end
  end

  @spec attach_credit_usage(integer() | nil, String.t(), String.t()) :: :ok
  def attach_credit_usage(nil, _node, _fqdn), do: :ok

  def attach_credit_usage(credit_id, node, fqdn) do
    from(credit in PaymentCredit, where: credit.id == ^credit_id)
    |> Repo.update_all(set: [consumed_node: node, consumed_fqdn: fqdn])

    :ok
  end

  @spec ensure_repo_enabled() :: :ok | Basenames.reason()
  def ensure_repo_enabled do
    if Basenames.repo_enabled?() do
      :ok
    else
      {:error, {:unavailable, "Server missing DATABASE_URL (basenames DB disabled)"}}
    end
  end

  @spec verify_payment(String.t(), String.t(), integer() | nil) :: result(payment())
  def verify_payment(address, payment_tx_hash, payment_chain_id) do
    with {:ok, recipient} <- payment_recipient(),
         {:ok, targets} <- payment_targets(payment_chain_id) do
      case Enum.reduce_while(targets, [], fn {chain_id, rpc_url}, failures ->
             case verify_payment_on_target(
                    chain_id,
                    rpc_url,
                    address,
                    payment_tx_hash,
                    recipient
                  ) do
               {:ok, payment} -> {:halt, {:ok, payment}}
               {:bad_request, message} -> {:halt, {:error, {:bad_request, message}}}
               {:not_found} -> {:cont, [:not_found | failures]}
               {:external, message} -> {:cont, [{:external, message} | failures]}
             end
           end) do
        {:ok, payment} ->
          {:ok, payment}

        {:error, {:bad_request, _message} = reason} ->
          {:error, reason}

        failures ->
          if Enum.any?(failures, &match?({:external, _}, &1)) and
               Enum.all?(failures, &match?({:external, _}, &1)) do
            {:error, {:external, :ethereum, "Payment verification unavailable"}}
          else
            {:error, {:bad_request, "Payment tx not found on Base or Ethereum"}}
          end
      end
    end
  end

  @spec reserve_oldest_credit(String.t(), String.t()) :: result(reservation())
  def reserve_oldest_credit(address, parent_node) do
    credit =
      from(credit in PaymentCredit,
        where:
          credit.parent_node == ^parent_node and credit.address == ^address and
            is_nil(credit.consumed_at),
        order_by: [asc: credit.created_at],
        limit: 1
      )
      |> Repo.one()

    if is_nil(credit) do
      {:error, {:payment_required, "Payment required (no free mints or credits remaining)"}}
    else
      with :ok <- consume_credit(credit) do
        {:ok,
         %{
           is_free: false,
           price_wei: credit.price_wei,
           payment_tx_hash: credit.payment_tx_hash,
           payment_chain_id: credit.payment_chain_id,
           credit_id: credit.id
         }}
      end
    end
  end

  defp reserve_free_or_credit(address, parent_node) do
    case reserve_free_mint(address, parent_node) do
      {:ok, reservation} -> {:ok, reservation}
      :none -> reserve_oldest_credit(address, parent_node)
    end
  end

  defp reserve_free_mint(address, parent_node) do
    {count, _} =
      from(allowance in PlatformPhx.Basenames.MintAllowance,
        where:
          allowance.parent_node == ^parent_node and allowance.address == ^address and
            allowance.free_mints_used < allowance.snapshot_total
      )
      |> Repo.update_all(
        inc: [free_mints_used: 1],
        set: [updated_at: DateTime.utc_now()]
      )

    if count > 0 do
      {:ok,
       %{
         is_free: true,
         price_wei: 0,
         payment_tx_hash: nil,
         payment_chain_id: nil,
         credit_id: nil
       }}
    else
      :none
    end
  end

  defp reserve_payment_credit(
         address,
         parent_node,
         parent_name,
         payment_tx_hash,
         payment_chain_id
       ) do
    with {:ok, credit} <-
           fetch_or_register_credit(
             parent_node,
             parent_name,
             address,
             payment_tx_hash,
             payment_chain_id
           ),
         :ok <- ensure_credit_owner(credit, address),
         :ok <- ensure_credit_available(credit),
         :ok <- consume_credit(credit) do
      {:ok,
       %{
         is_free: false,
         price_wei: credit.price_wei,
         payment_tx_hash: credit.payment_tx_hash,
         payment_chain_id: credit.payment_chain_id,
         credit_id: credit.id
       }}
    end
  end

  defp fetch_or_register_credit(
         parent_node,
         parent_name,
         address,
         payment_tx_hash,
         payment_chain_id
       ) do
    case find_credit(payment_tx_hash, payment_chain_id) do
      nil ->
        with {:ok, payment} <- verify_payment(address, payment_tx_hash, payment_chain_id) do
          register_or_find_credit(parent_node, parent_name, address, payment)
        end

      credit ->
        {:ok, credit}
    end
  end

  defp register_or_find_credit(parent_node, parent_name, address, payment) do
    existing = find_credit(payment.payment_tx_hash, payment.payment_chain_id)

    if existing do
      {:ok, existing}
    else
      attrs = %{
        parent_node: parent_node,
        parent_name: parent_name,
        address: address,
        payment_tx_hash: payment.payment_tx_hash,
        payment_chain_id: payment.payment_chain_id,
        price_wei: payment.price_wei
      }

      case %PaymentCredit{}
           |> PaymentCredit.changeset(attrs)
           |> Repo.insert() do
        {:ok, credit} ->
          {:ok, credit}

        {:error, changeset} ->
          refetch_or_changeset_error(payment, changeset)
      end
    end
  end

  defp refetch_or_changeset_error(payment, changeset) do
    existing = find_credit(payment.payment_tx_hash, payment.payment_chain_id)

    if existing do
      {:ok, existing}
    else
      {:error, {:bad_request, Validation.format_changeset_errors(changeset)}}
    end
  end

  defp ensure_credit_owner(credit, address) do
    if credit.address == address do
      :ok
    else
      {:error, {:bad_request, "Payment tx already registered to another address"}}
    end
  end

  defp ensure_credit_available(credit) do
    if is_nil(credit.consumed_at) do
      :ok
    else
      {:error, {:conflict, "Payment already used"}}
    end
  end

  defp consume_credit(credit) do
    {count, _} =
      from(row in PaymentCredit, where: row.id == ^credit.id and is_nil(row.consumed_at))
      |> Repo.update_all(set: [consumed_at: DateTime.utc_now()])

    if count == 0 do
      {:error, {:conflict, "Payment already used"}}
    else
      :ok
    end
  end

  defp find_credit(payment_tx_hash, payment_chain_id) do
    from(credit in PaymentCredit,
      where:
        credit.payment_tx_hash == ^payment_tx_hash and
          credit.payment_chain_id == ^payment_chain_id,
      limit: 1
    )
    |> Repo.one()
  end

  defp payment_recipient do
    case RuntimeConfig.basenames_payment_recipient() do
      nil ->
        {:error,
         {:unavailable, "Server missing AGENT_BASENAME_PAYMENT_RECIPIENT (paid mints disabled)"}}

      recipient ->
        {:ok, String.downcase(recipient)}
    end
  end

  defp payment_targets(chain_id) do
    base_chain_id = Basenames.base_chain_id()
    ethereum_chain_id = Basenames.ethereum_chain_id()

    targets =
      case chain_id do
        ^base_chain_id ->
          [{base_chain_id, RuntimeConfig.base_rpc_url()}]

        ^ethereum_chain_id ->
          [{ethereum_chain_id, RuntimeConfig.ethereum_rpc_url()}]

        nil ->
          [
            {base_chain_id, RuntimeConfig.base_rpc_url()},
            {ethereum_chain_id, RuntimeConfig.ethereum_rpc_url()}
          ]

        _ ->
          :unsupported
      end

    cond do
      targets == :unsupported ->
        {:error, {:bad_request, "Unsupported payment chain"}}

      true ->
        configured = Enum.reject(targets, fn {_chain_id, rpc_url} -> is_nil(rpc_url) end)

        if Enum.empty?(configured) do
          {:error, {:unavailable, "Server missing RPC URL(s)"}}
        else
          {:ok, configured}
        end
    end
  end

  defp verify_payment_on_target(chain_id, rpc_url, address, payment_tx_hash, recipient) do
    price_wei = String.to_integer(RuntimeConfig.basenames_price_wei())

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
          {:bad_request, "Payment tx from does not match"}

        to != recipient ->
          {:bad_request, "Payment recipient mismatch"}

        value < price_wei ->
          {:bad_request, "Payment amount too low"}

        status != "0x1" ->
          {:bad_request, "Payment tx not successful"}

        true ->
          {:ok,
           %{
             payment_tx_hash: payment_tx_hash,
             payment_chain_id: chain_id,
             price_wei: value
           }}
      end
    else
      {:error, _message} -> {:external, "Payment verification unavailable"}
      true -> {:not_found}
    end
  end
end
