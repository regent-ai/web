defmodule PlatformPhxWeb.Api.ReportControllerTest do
  use PlatformPhxWeb.ConnCase, async: false

  alias PlatformPhx.OperatorReports.BugReport
  alias PlatformPhx.OperatorReports.SecurityReport
  alias PlatformPhx.Repo

  @wallet_address "0x1111111111111111111111111111111111111111"
  @registry_address "0x2222222222222222222222222222222222222222"

  test "bug endpoint stores and confirms a report", %{conn: conn} do
    response =
      conn
      |> post("/api/bug-report", %{
        "summary" => "  can't do xyz ",
        "details" => " more detail\r\nhere ",
        "reporting_agent" => %{
          "wallet_address" => @wallet_address,
          "chain_id" => 11_155_111,
          "registry_address" => @registry_address,
          "token_id" => "99",
          "label" => "Hermes operator"
        }
      })
      |> json_response(200)

    assert response["ok"] == true
    assert response["public_url"] == "https://regents.sh/bug-report"
    assert response["message"] =~ "status will appear"
    assert response["report"]["summary"] == "can't do xyz"
    assert response["report"]["details"] == "more detail\nhere"
    assert response["report"]["status"] == "pending"

    stored = Repo.get_by!(BugReport, report_id: response["report"]["report_id"])
    assert stored.summary == "can't do xyz"
  end

  test "bug endpoint rejects malformed identity payload", %{conn: conn} do
    response =
      conn
      |> post("/api/bug-report", %{
        "summary" => "can't do xyz",
        "details" => "details",
        "reporting_agent" => %{
          "wallet_address" => "not-an-address",
          "chain_id" => 11_155_111,
          "registry_address" => @registry_address,
          "token_id" => "99"
        }
      })
      |> json_response(400)

    assert response["statusMessage"] =~ "has invalid format"
  end

  test "bug endpoint rejects non-positive chain ids", %{conn: conn} do
    response =
      conn
      |> post("/api/bug-report", %{
        "summary" => "can't do xyz",
        "details" => "details",
        "reporting_agent" => %{
          "wallet_address" => @wallet_address,
          "chain_id" => 0,
          "registry_address" => @registry_address,
          "token_id" => "99"
        }
      })
      |> json_response(400)

    assert response["statusMessage"] =~ "must be greater than"
  end

  test "security endpoint stores and confirms a private report", %{conn: conn} do
    response =
      conn
      |> post("/api/security-report", %{
        "summary" => "  private vuln ",
        "details" => " impact and steps ",
        "contact" => " @xyz on telegram ",
        "reporting_agent" => %{
          "wallet_address" => @wallet_address,
          "chain_id" => 11_155_111,
          "registry_address" => @registry_address,
          "token_id" => "99"
        }
      })
      |> json_response(200)

    assert response["ok"] == true
    assert response["message"] =~ "private follow-up"
    assert response["report"]["contact"] == "@xyz on telegram"
    refute Map.has_key?(response, "public_url")

    stored = Repo.get_by!(SecurityReport, report_id: response["report"]["report_id"])
    assert stored.summary == "private vuln"
  end

  test "security endpoint requires contact", %{conn: conn} do
    response =
      conn
      |> post("/api/security-report", %{
        "summary" => "private vuln",
        "details" => "impact and steps",
        "reporting_agent" => %{
          "wallet_address" => @wallet_address,
          "chain_id" => 11_155_111,
          "registry_address" => @registry_address,
          "token_id" => "99"
        }
      })
      |> json_response(400)

    assert response["statusMessage"] =~ "can't be blank"
  end
end
