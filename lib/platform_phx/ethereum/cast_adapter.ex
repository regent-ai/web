defmodule PlatformPhx.Ethereum.CastAdapter do
  @moduledoc false
  @behaviour PlatformPhx.Ethereum.Adapter

  @impl true
  def namehash(name) do
    run_cast(["namehash", String.trim(name)])
  end

  @impl true
  def verify_signature(address, message, signature) do
    case System.cmd(
           "cast",
           ["wallet", "verify", "--address", String.trim(address), message, signature],
           stderr_to_stdout: true
         ) do
      {_, 0} -> :ok
      {output, _status} -> {:error, String.trim(output)}
    end
  rescue
    error in ErlangError ->
      {:error, format_system_error(error)}
  catch
    :exit, reason ->
      {:error, inspect(reason)}
  end

  @impl true
  def synthetic_tx_hash(payload) do
    run_cast(["keccak", payload])
  end

  defp run_cast(args) do
    case System.cmd("cast", args, stderr_to_stdout: true) do
      {output, 0} -> {:ok, String.trim(output)}
      {output, _status} -> {:error, String.trim(output)}
    end
  rescue
    error in ErlangError ->
      {:error, format_system_error(error)}
  catch
    :exit, reason ->
      {:error, inspect(reason)}
  end

  defp format_system_error(%ErlangError{original: :enoent}) do
    "cast executable not found on the server"
  end

  defp format_system_error(%ErlangError{original: original}) when is_atom(original) do
    Atom.to_string(original)
  end

  defp format_system_error(%ErlangError{} = error) do
    Exception.message(error)
  end
end
