defmodule PlatformPhxWeb.BugReportLiveTest do
  use PlatformPhxWeb.ConnCase, async: false

  import Ecto.Query
  import Phoenix.LiveViewTest

  alias PlatformPhx.OperatorReports
  alias PlatformPhx.OperatorReports.BugReport
  alias PlatformPhx.Repo

  @wallet_address "0x1111111111111111111111111111111111111111"
  @registry_address "0x2222222222222222222222222222222222222222"

  test "bug report route renders the empty state", %{conn: conn} do
    {:ok, _view, html} = live(conn, "/bug-report")

    assert html =~ "Bug Report Ledger"
    assert html =~ "No bug reports have been filed yet."
    assert html =~ "Live Board"
    assert html =~ "agent sends `regent bug` through the CLI,"
    assert html =~ ~s(href="/bug-report")
  end

  test "bug report route renders reports recent first with details", %{conn: conn} do
    {:ok, older} = create_bug_report("older summary", "older details")
    {:ok, newer} = create_bug_report("newer summary", "newer details")

    Repo.update_all(from(report in BugReport, where: report.id == ^older.id),
      set: [created_at: ~U[2026-04-01 10:00:00Z]]
    )

    Repo.update_all(from(report in BugReport, where: report.id == ^newer.id),
      set: [created_at: ~U[2026-04-01 11:00:00Z]]
    )

    {:ok, _view, html} = live(conn, "/bug-report")

    assert html =~ "newer summary"
    assert html =~ "older summary"
    assert html =~ "Show details"
    assert html =~ "newer details"

    assert position(html, "newer summary") < position(html, "older summary")
  end

  test "bug report route loads older reports on infinite scroll", %{conn: conn} do
    for index <- 1..51 do
      summary = "report-" <> String.pad_leading(Integer.to_string(index), 3, "0")
      {:ok, report} = create_bug_report(summary, "details #{index}")

      Repo.update_all(from(row in BugReport, where: row.id == ^report.id),
        set: [created_at: DateTime.add(~U[2026-04-01 10:00:00Z], index, :second)]
      )
    end

    {:ok, view, html} = live(conn, "/bug-report")

    assert html =~ "Loading older reports"
    assert html =~ "report-051"
    refute html =~ "report-001"

    html_two =
      view
      |> element("#platform-bug-ledger-root")
      |> render_hook("load-more")

    assert html_two =~ "report-051"
    assert html_two =~ "report-001"
    refute html_two =~ "Page 2"
  end

  defp create_bug_report(summary, details) do
    OperatorReports.create_bug_report(%{
      "summary" => summary,
      "details" => details,
      "reporting_agent" => %{
        "wallet_address" => @wallet_address,
        "chain_id" => 11_155_111,
        "registry_address" => @registry_address,
        "token_id" => "99",
        "label" => "Hermes operator"
      }
    })
  end

  defp position(haystack, needle) do
    {index, _length} = :binary.match(haystack, needle)
    index
  end
end
