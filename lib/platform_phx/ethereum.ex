defmodule PlatformPhx.Ethereum do
  @moduledoc false

  alias PlatformPhx.Ethereum.CastAdapter

  @address_regex ~r/^0x[a-fA-F0-9]{40}$/
  @tx_hash_regex ~r/^0x[a-fA-F0-9]{64}$/

  @spec normalize_address(term()) :: String.t() | nil
  def normalize_address(value) when is_binary(value) do
    trimmed = String.trim(value)

    if Regex.match?(@address_regex, trimmed) do
      String.downcase(trimmed)
    else
      nil
    end
  end

  def normalize_address(_value), do: nil

  @spec valid_address?(term()) :: boolean()
  def valid_address?(value), do: not is_nil(normalize_address(value))

  @spec valid_tx_hash?(term()) :: boolean()
  def valid_tx_hash?(value) when is_binary(value),
    do: Regex.match?(@tx_hash_regex, String.trim(value))

  def valid_tx_hash?(_value), do: false

  @spec namehash(String.t()) :: {:ok, String.t()} | {:error, String.t()}
  def namehash(name) do
    adapter().namehash(name)
  end

  @spec verify_signature(String.t(), String.t(), String.t()) :: :ok | {:error, String.t()}
  def verify_signature(address, message, signature) do
    case normalize_address(address) do
      nil -> {:error, "invalid address"}
      normalized_address -> adapter().verify_signature(normalized_address, message, signature)
    end
  end

  @spec synthetic_tx_hash([String.t()] | String.t()) :: {:ok, String.t()} | {:error, String.t()}
  def synthetic_tx_hash(parts) when is_list(parts),
    do: parts |> Enum.join(":") |> synthetic_tx_hash()

  def synthetic_tx_hash(payload) when is_binary(payload) do
    adapter().synthetic_tx_hash(payload)
  end

  @spec json_rpc(String.t(), String.t(), list()) :: {:ok, map() | nil} | {:error, String.t()}
  def json_rpc(url, method, params) do
    request =
      Req.new(
        url: url,
        json: %{
          id: 1,
          jsonrpc: "2.0",
          method: method,
          params: params
        }
      )

    case Req.post(request) do
      {:ok, response} ->
        case response.body do
          %{"error" => %{"message" => message}} -> {:error, message}
          %{"result" => result} -> {:ok, result}
          other -> {:error, "Unexpected RPC response: #{inspect(other)}"}
        end

      {:error, error} ->
        {:error, Exception.message(error)}
    end
  end

  @spec hex_to_integer(term()) :: integer()
  def hex_to_integer("0x"), do: 0

  def hex_to_integer(value) when is_binary(value),
    do: String.to_integer(String.replace_prefix(value, "0x", ""), 16)

  def hex_to_integer(_value), do: 0

  defp adapter do
    Application.get_env(:platform_phx, :ethereum_adapter, CastAdapter)
  end
end
