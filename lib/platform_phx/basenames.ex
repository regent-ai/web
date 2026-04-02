defmodule PlatformPhx.Basenames do
  @moduledoc false

  alias PlatformPhx.Basenames.Payments
  alias PlatformPhx.Basenames.Reads
  alias PlatformPhx.Basenames.Validation
  alias PlatformPhx.Basenames.Writes
  alias PlatformPhx.Ethereum
  alias PlatformPhx.Repo
  alias PlatformPhx.RuntimeConfig

  @type reason ::
          {:bad_request, String.t()}
          | {:not_found, String.t()}
          | {:forbidden, String.t()}
          | {:conflict, String.t()}
          | {:payment_required, String.t()}
          | {:unavailable, String.t()}
          | {:external, atom(), String.t()}

  @type result(value) :: {:ok, value} | {:error, reason()}

  @zero_address "0x0000000000000000000000000000000000000000"
  @base_chain_id 8453
  @ethereum_chain_id 1
  @max_signature_age_ms 60 * 60 * 1000

  @spec config_payload() :: result(map())
  def config_payload, do: Reads.config_payload()

  @spec allowance_payload(term()) :: result(map())
  def allowance_payload(address), do: Reads.allowance_payload(address)

  @spec allowances_payload() :: result(map())
  def allowances_payload, do: Reads.allowances_payload()

  @spec recent_payload(term()) :: result(map())
  def recent_payload(limit \\ 12), do: Reads.recent_payload(limit)

  @spec owned_payload(term()) :: result(map())
  def owned_payload(address), do: Reads.owned_payload(address)

  @spec credits_payload(term()) :: result(map())
  def credits_payload(address), do: Reads.credits_payload(address)

  @spec availability_payload(term()) :: result(map())
  def availability_payload(label), do: Reads.availability_payload(label)

  @spec register_credit(map()) :: result(map())
  def register_credit(params), do: Payments.register_credit(params)

  @spec mint_name(map()) :: result(map())
  def mint_name(params), do: Writes.mint_name(params)

  @spec mark_in_use(map()) :: result(map())
  def mark_in_use(params), do: Writes.mark_in_use(params)

  @spec create_mint_message(String.t(), String.t(), integer(), integer()) :: String.t()
  def create_mint_message(address, fqdn, chain_id, timestamp) do
    Validation.create_mint_message(address, fqdn, chain_id, timestamp)
  end

  @spec validate_label(term()) :: result(String.t())
  def validate_label(raw_label), do: Validation.validate_label(raw_label)

  @spec to_subname_fqdn(term(), term()) :: String.t()
  def to_subname_fqdn(label, parent_name), do: Validation.to_subname_fqdn(label, parent_name)

  @spec reserved_label?(term()) :: boolean()
  def reserved_label?(label), do: Validation.reserved_label?(label)

  @spec parent_name() :: String.t()
  def parent_name, do: String.downcase(RuntimeConfig.basename_parent_name())

  @spec ens_parent_name() :: String.t()
  def ens_parent_name, do: String.downcase(RuntimeConfig.ens_parent_name())

  @spec parent_node() :: String.t()
  def parent_node do
    case Ethereum.namehash(parent_name()) do
      {:ok, node} -> node
      {:error, message} -> raise ArgumentError, message
    end
  end

  @spec repo_enabled?() :: boolean()
  def repo_enabled?, do: not is_nil(Repo.config()[:database]) or not is_nil(Repo.config()[:url])

  @spec zero_address() :: String.t()
  def zero_address, do: @zero_address

  @spec base_chain_id() :: integer()
  def base_chain_id, do: @base_chain_id

  @spec ethereum_chain_id() :: integer()
  def ethereum_chain_id, do: @ethereum_chain_id

  @spec max_signature_age_ms() :: integer()
  def max_signature_age_ms, do: @max_signature_age_ms
end
