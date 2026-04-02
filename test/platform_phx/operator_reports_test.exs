defmodule PlatformPhx.OperatorReportsTest do
  use PlatformPhx.DataCase, async: false

  alias PlatformPhx.OperatorReports
  alias PlatformPhx.OperatorReports.BugReport
  alias PlatformPhx.OperatorReports.SecurityReport
  alias PlatformPhx.Repo

  @wallet_address "0x1111111111111111111111111111111111111111"
  @registry_address "0x2222222222222222222222222222222222222222"

  test "bug reports sanitize text and default to pending" do
    assert {:ok, payload} =
             OperatorReports.create_bug_report_payload(%{
               "summary" => "  can't do xyz\x07  ",
               "details" => " first line\r\nsecond line ",
               "reporting_agent" => %{
                 "wallet_address" => @wallet_address,
                 "chain_id" => 11_155_111,
                 "registry_address" => @registry_address,
                 "token_id" => "99",
                 "label" => "  Hermes operator  "
               }
             })

    assert payload["public_url"] == "https://regents.sh/bug-report"
    assert payload["report"]["summary"] == "can't do xyz"
    assert payload["report"]["details"] == "first line\nsecond line"
    assert payload["report"]["status"] == "pending"
    assert payload["report"]["reporting_agent"]["label"] == "Hermes operator"
  end

  test "security reports sanitize text and store contact" do
    assert {:ok, payload} =
             OperatorReports.create_security_report_payload(%{
               "summary" => "  private vuln  ",
               "details" => " impact\r\nsteps ",
               "contact" => "  @xyz on telegram\x07 ",
               "reporting_agent" => %{
                 "wallet_address" => @wallet_address,
                 "chain_id" => 11_155_111,
                 "registry_address" => @registry_address,
                 "token_id" => "99"
               }
             })

    assert payload["report"]["summary"] == "private vuln"
    assert payload["report"]["details"] == "impact\nsteps"
    assert payload["report"]["contact"] == "@xyz on telegram"

    stored = Repo.get_by!(SecurityReport, report_id: payload["report"]["report_id"])
    assert stored.contact == "@xyz on telegram"
    refute Map.has_key?(payload["report"]["reporting_agent"], "label")
  end

  test "reports reject non-positive chain ids" do
    assert {:error, {:bad_request, message}} =
             OperatorReports.create_bug_report(%{
               "summary" => "can't do xyz",
               "details" => "details",
               "reporting_agent" => %{
                 "wallet_address" => @wallet_address,
                 "chain_id" => 0,
                 "registry_address" => @registry_address,
                 "token_id" => "99"
               }
             })

    assert message =~ "must be greater than"
  end

  test "bug reports list recent first" do
    {:ok, older} =
      OperatorReports.create_bug_report(%{
        "summary" => "older",
        "details" => "older details",
        "reporting_agent" => %{
          "wallet_address" => @wallet_address,
          "chain_id" => 11_155_111,
          "registry_address" => @registry_address,
          "token_id" => "1"
        }
      })

    {:ok, newer} =
      OperatorReports.create_bug_report(%{
        "summary" => "newer",
        "details" => "newer details",
        "reporting_agent" => %{
          "wallet_address" => @wallet_address,
          "chain_id" => 11_155_111,
          "registry_address" => @registry_address,
          "token_id" => "2"
        }
      })

    Repo.update_all(from(report in BugReport, where: report.id == ^older.id),
      set: [created_at: ~U[2026-04-01 10:00:00Z]]
    )

    Repo.update_all(from(report in BugReport, where: report.id == ^newer.id),
      set: [created_at: ~U[2026-04-01 11:00:00Z]]
    )

    assert Enum.map(OperatorReports.list_bug_reports(), & &1.summary) == ["newer", "older"]
  end

  test "bug reports page results are bounded and expose next pages" do
    for index <- 1..51 do
      assert {:ok, _report} =
               create_bug_report("summary #{index}", "details #{index}")
    end

    page_one = OperatorReports.list_bug_reports_page(1, 50)
    page_two = OperatorReports.list_bug_reports_page(2, 50)

    assert length(page_one.entries) == 50
    assert page_one.has_previous == false
    assert page_one.has_next == true

    assert Enum.map(page_two.entries, & &1.summary) |> length() == 1
    assert page_two.has_previous == true
    assert page_two.has_next == false
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
end
