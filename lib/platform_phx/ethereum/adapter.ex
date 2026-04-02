defmodule PlatformPhx.Ethereum.Adapter do
  @moduledoc false

  @callback namehash(String.t()) :: {:ok, String.t()} | {:error, String.t()}
  @callback verify_signature(String.t(), String.t(), String.t()) :: :ok | {:error, String.t()}
  @callback synthetic_tx_hash(String.t()) :: {:ok, String.t()} | {:error, String.t()}
end
