defmodule PlatformPhx.CutoverSchemaTest do
  use PlatformPhx.DataCase, async: false

  test "retained tables match the old platform timestamp columns" do
    %{rows: rows} =
      Ecto.Adapters.SQL.query!(
        Repo,
        """
        select table_name, column_name, data_type
        from information_schema.columns
        where table_name in (
          'basenames_mint_allowances',
          'basenames_mints',
          'basenames_payment_credits',
          'agentlaunch_auctions'
        )
          and column_name in (
            'created_at',
            'updated_at',
            'inserted_at',
            'ens_assigned_at',
            'consumed_at',
            'started_at',
            'ends_at',
            'claim_at'
          )
        order by table_name, column_name
        """,
        []
      )

    assert ["basenames_mint_allowances", "created_at", "timestamp with time zone"] in rows
    assert ["basenames_mint_allowances", "updated_at", "timestamp with time zone"] in rows

    assert ["basenames_mints", "created_at", "timestamp with time zone"] in rows
    assert ["basenames_mints", "ens_assigned_at", "timestamp with time zone"] in rows

    assert ["basenames_payment_credits", "created_at", "timestamp with time zone"] in rows
    assert ["basenames_payment_credits", "consumed_at", "timestamp with time zone"] in rows

    assert ["agentlaunch_auctions", "created_at", "timestamp with time zone"] in rows
    assert ["agentlaunch_auctions", "updated_at", "timestamp with time zone"] in rows
    assert ["agentlaunch_auctions", "started_at", "timestamp with time zone"] in rows
    assert ["agentlaunch_auctions", "ends_at", "timestamp with time zone"] in rows
    assert ["agentlaunch_auctions", "claim_at", "timestamp with time zone"] in rows

    refute Enum.any?(rows, fn
             [table_name, "inserted_at", _data_type] ->
               table_name in [
                 "basenames_mint_allowances",
                 "basenames_mints",
                 "basenames_payment_credits",
                 "agentlaunch_auctions"
               ]

             _row ->
               false
           end)
  end
end
