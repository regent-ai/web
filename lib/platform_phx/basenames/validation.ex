defmodule PlatformPhx.Basenames.Validation do
  @moduledoc false

  alias PlatformPhx.Basenames
  alias PlatformPhx.Ethereum

  @type reason :: Basenames.reason()
  @type result(value) :: Basenames.result(value)

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

  @spec normalize_address(term()) :: result(String.t())
  def normalize_address(value) do
    case Ethereum.normalize_address(value) do
      nil -> {:error, {:bad_request, "Invalid address"}}
      normalized -> {:ok, normalized}
    end
  end

  @spec validate_payment_tx_hash(term()) :: result(String.t())
  def validate_payment_tx_hash(value) do
    case trim_binary(value) do
      nil ->
        {:error, {:bad_request, "Invalid payment tx hash"}}

      tx_hash ->
        normalized = String.downcase(tx_hash)

        if Ethereum.valid_tx_hash?(normalized) do
          {:ok, normalized}
        else
          {:error, {:bad_request, "Invalid payment tx hash"}}
        end
    end
  end

  @spec require_nonblank(term(), String.t()) :: result(String.t())
  def require_nonblank(value, message) do
    case trim_binary(value) do
      nil -> {:error, {:bad_request, message}}
      trimmed -> {:ok, trimmed}
    end
  end

  @spec parse_timestamp(term()) :: result(integer())
  def parse_timestamp(value) when is_integer(value), do: {:ok, value}

  def parse_timestamp(value) when is_binary(value) and value != "" do
    {:ok, String.to_integer(value)}
  rescue
    ArgumentError -> {:error, {:bad_request, "Missing timestamp"}}
  end

  def parse_timestamp(_value), do: {:error, {:bad_request, "Missing timestamp"}}

  @spec validate_signature_age(integer()) :: :ok | reason()
  def validate_signature_age(timestamp) do
    now = System.system_time(:millisecond)

    if abs(now - timestamp) > Basenames.max_signature_age_ms() do
      {:error, {:bad_request, "Signature expired"}}
    else
      :ok
    end
  end

  @spec namehash(String.t()) :: result(String.t())
  def namehash(name) do
    case Ethereum.namehash(String.trim(name)) do
      {:ok, hash} -> {:ok, hash}
      {:error, message} -> {:error, {:external, :ethereum, message}}
    end
  end

  @spec synthetic_mint_tx_hash(String.t(), String.t(), integer()) :: result(String.t())
  def synthetic_mint_tx_hash(address, label, timestamp) do
    synthetic_tx_hash("mint:#{address}:#{label}:#{timestamp}")
  end

  @spec synthetic_creator_tx_hash(String.t(), String.t()) :: result(String.t())
  def synthetic_creator_tx_hash(address, label) do
    synthetic_tx_hash("creator:#{address}:#{label}")
  end

  @spec create_mint_message(String.t(), String.t(), integer(), integer()) :: String.t()
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

  @spec validate_label(term()) :: result(String.t())
  def validate_label(raw_label) do
    normalized_label = raw_label |> to_string() |> String.trim() |> String.downcase()

    cond do
      normalized_label == "" ->
        {:error, {:bad_request, "Missing name"}}

      String.length(normalized_label) < 3 or String.length(normalized_label) > 15 ->
        {:error, {:bad_request, "Name must be 3-15 characters"}}

      not Regex.match?(~r/^[a-z0-9]+$/, normalized_label) ->
        {:error, {:bad_request, "Use only lowercase letters and numbers"}}

      Regex.match?(~r/^\d+$/, normalized_label) and String.to_integer(normalized_label) <= 10_000 ->
        {:error, {:bad_request, "Numeric names 0-10000 are not allowed"}}

      true ->
        {:ok, normalized_label}
    end
  end

  @spec to_subname_fqdn(term(), term()) :: String.t()
  def to_subname_fqdn(label, parent_name) do
    "#{String.downcase(String.trim(to_string(label)))}.#{String.downcase(String.trim(to_string(parent_name)))}"
  end

  @spec reserved_label?(term()) :: boolean()
  def reserved_label?(label) do
    label
    |> to_string()
    |> String.trim()
    |> String.downcase()
    |> then(&(&1 in @reserved_labels))
  end

  @spec resolve_label(term(), term()) :: String.t() | nil
  def resolve_label(label, fqdn) do
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

  @spec blank_to_nil(term()) :: String.t() | nil
  def blank_to_nil(nil), do: nil

  def blank_to_nil(value) when is_binary(value) do
    trimmed = String.trim(value)
    if trimmed == "", do: nil, else: trimmed
  end

  def blank_to_nil(value), do: value

  @spec truthy?(term()) :: boolean()
  def truthy?(value) when value in [true, "true", "1", 1, "yes", "on"], do: true
  def truthy?(_value), do: false

  @spec integer_or_nil(term()) :: integer() | nil
  def integer_or_nil(nil), do: nil
  def integer_or_nil(value) when is_integer(value), do: value

  def integer_or_nil(value) when is_binary(value) and value != "" do
    String.to_integer(value)
  rescue
    ArgumentError -> nil
  end

  def integer_or_nil(_value), do: nil

  @spec iso_datetime_fields(map(), [String.t()]) :: map()
  def iso_datetime_fields(map, keys) do
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

  @spec format_changeset_errors(Ecto.Changeset.t()) :: String.t()
  def format_changeset_errors(changeset) do
    changeset.errors
    |> Enum.map(fn {field, {message, _opts}} -> "#{field} #{message}" end)
    |> Enum.join(", ")
  end

  defp synthetic_tx_hash(payload) do
    case Ethereum.synthetic_tx_hash(payload) do
      {:ok, hash} -> {:ok, hash}
      {:error, message} -> {:error, {:external, :ethereum, message}}
    end
  end

  defp trim_binary(value) when is_binary(value) do
    trimmed = String.trim(value)
    if trimmed == "", do: nil, else: trimmed
  end

  defp trim_binary(_value), do: nil

  defp trim_and_strip_dots(nil), do: ""
  defp trim_and_strip_dots(value), do: value |> to_string() |> String.trim() |> String.trim(".")
end
