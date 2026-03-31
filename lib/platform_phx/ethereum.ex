defmodule PlatformPhx.Ethereum do
  @moduledoc false

  @address_regex ~r/^0x[a-fA-F0-9]{40}$/
  @tx_hash_regex ~r/^0x[a-fA-F0-9]{64}$/

  def normalize_address(value) when is_binary(value) do
    trimmed = String.trim(value)

    if Regex.match?(@address_regex, trimmed) do
      String.downcase(trimmed)
    else
      nil
    end
  end

  def normalize_address(_value), do: nil

  def valid_address?(value), do: not is_nil(normalize_address(value))

  def valid_tx_hash?(value) when is_binary(value),
    do: Regex.match?(@tx_hash_regex, String.trim(value))

  def valid_tx_hash?(_value), do: false

  def namehash!(name) do
    run_cast!(["namehash", String.trim(name)])
  end

  def verify_signature!(address, message, signature) do
    normalized_address = normalize_address(address) || raise ArgumentError, "invalid address"

    {_, 0} =
      System.cmd(
        "cast",
        ["wallet", "verify", "--address", normalized_address, message, signature],
        stderr_to_stdout: true
      )

    :ok
  rescue
    error in ErlangError ->
      raise ArgumentError, message: Exception.message(error.original)
  catch
    :exit, reason ->
      raise ArgumentError, message: inspect(reason)
  end

  def synthetic_tx_hash(parts) when is_list(parts),
    do: parts |> Enum.join(":") |> synthetic_tx_hash()

  def synthetic_tx_hash(payload) when is_binary(payload) do
    run_cast!(["keccak", payload])
  end

  def json_rpc(url, method, params) do
    response =
      Req.post!(url,
        json: %{
          id: 1,
          jsonrpc: "2.0",
          method: method,
          params: params
        }
      )

    case response.body do
      %{"error" => %{"message" => message}} -> {:error, message}
      %{"result" => result} -> {:ok, result}
      other -> {:error, "Unexpected RPC response: #{inspect(other)}"}
    end
  rescue
    error -> {:error, Exception.message(error)}
  end

  def hex_to_integer("0x"), do: 0

  def hex_to_integer(value) when is_binary(value),
    do: String.to_integer(String.replace_prefix(value, "0x", ""), 16)

  def hex_to_integer(_value), do: 0

  defp run_cast!(args) do
    {output, 0} = System.cmd("cast", args, stderr_to_stdout: true)
    String.trim(output)
  rescue
    error in ErlangError ->
      raise ArgumentError, message: Exception.message(error.original)
  catch
    :exit, reason ->
      raise ArgumentError, message: inspect(reason)
  end
end
