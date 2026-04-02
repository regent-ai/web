defmodule PlatformPhx.OperatorReports.ReportText do
  @moduledoc false

  @control_chars ~r/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u

  @spec sanitize(term()) :: String.t() | nil
  def sanitize(nil), do: nil

  def sanitize(value) when is_binary(value) do
    value
    |> String.replace(~r/\r\n?/, "\n")
    |> String.replace(@control_chars, "")
    |> String.trim()
  end

  def sanitize(_value), do: nil
end
