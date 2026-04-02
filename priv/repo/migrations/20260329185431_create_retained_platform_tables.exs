defmodule PlatformPhx.Repo.Migrations.CreateRetainedPlatformTables do
  use Ecto.Migration

  def change do
    create_if_not_exists table(:basenames_mint_allowances, primary_key: false) do
      add :parent_node, :string, size: 66, primary_key: true
      add :parent_name, :text, null: false
      add :address, :string, size: 42, primary_key: true
      add :snapshot_block_number, :integer, null: false
      add :snapshot_total, :integer, null: false
      add :free_mints_used, :integer, null: false, default: 0
      timestamps(type: :utc_datetime, inserted_at: :created_at, updated_at: :updated_at)
    end

    create_if_not_exists index(:basenames_mint_allowances, [:address],
                           name: :basenames_mint_allowances_by_address
                         )

    create_if_not_exists table(:basenames_mints) do
      add :parent_node, :string, size: 66, null: false
      add :parent_name, :text, null: false
      add :label, :string, size: 63, null: false
      add :fqdn, :text, null: false
      add :node, :string, size: 66, null: false
      add :ens_fqdn, :text
      add :ens_node, :string, size: 66
      add :owner_address, :string, size: 42, null: false
      add :tx_hash, :string, size: 66, null: false
      add :ens_tx_hash, :string, size: 66
      add :ens_assigned_at, :utc_datetime
      add :payment_tx_hash, :string, size: 66
      add :payment_chain_id, :integer
      add :price_wei, :bigint
      add :is_free, :boolean, null: false, default: false
      add :is_in_use, :boolean, null: false, default: false
      timestamps(type: :utc_datetime, inserted_at: :created_at, updated_at: false)
    end

    create_if_not_exists unique_index(:basenames_mints, [:node],
                           name: :basenames_mints_node_unique
                         )

    create_if_not_exists unique_index(:basenames_mints, [:payment_tx_hash, :payment_chain_id],
                           name: :basenames_mints_payment_tx_unique
                         )

    create_if_not_exists index(:basenames_mints, [:owner_address],
                           name: :basenames_mints_by_owner
                         )

    create_if_not_exists index(:basenames_mints, [:parent_node], name: :basenames_mints_by_parent)

    create_if_not_exists table(:basenames_payment_credits) do
      add :parent_node, :string, size: 66, null: false
      add :parent_name, :text, null: false
      add :address, :string, size: 42, null: false
      add :payment_tx_hash, :string, size: 66, null: false
      add :payment_chain_id, :integer
      add :price_wei, :bigint, null: false
      add :consumed_at, :utc_datetime
      add :consumed_node, :string, size: 66
      add :consumed_fqdn, :text
      timestamps(type: :utc_datetime, inserted_at: :created_at, updated_at: false)
    end

    create_if_not_exists unique_index(
                           :basenames_payment_credits,
                           [:payment_tx_hash, :payment_chain_id],
                           name: :basenames_payment_credits_tx_unique
                         )

    create_if_not_exists index(:basenames_payment_credits, [:address],
                           name: :basenames_payment_credits_by_address
                         )

    create_if_not_exists index(:basenames_payment_credits, [:parent_node],
                           name: :basenames_payment_credits_by_parent
                         )

    create_if_not_exists table(:agentlaunch_auctions) do
      add :source_job_id, :string, size: 64
      add :agent_id, :string, size: 128, null: false
      add :agent_name, :string, size: 160, null: false
      add :owner_address, :string, size: 42, null: false
      add :auction_address, :string, size: 42, null: false
      add :token_address, :string, size: 42
      add :network, :string, size: 16, null: false, default: "base"
      add :chain_id, :integer, null: false, default: 8453
      add :status, :string, size: 24, null: false, default: "active"
      add :started_at, :utc_datetime, null: false
      add :ends_at, :utc_datetime
      add :claim_at, :utc_datetime
      add :bidders, :integer, null: false, default: 0
      add :raised_currency, :string, size: 64, null: false, default: "0 ETH"
      add :target_currency, :string, size: 64, null: false, default: "0 ETH"
      add :progress_percent, :integer, null: false, default: 0
      add :notes, :text
      add :uniswap_url, :text
      timestamps(type: :utc_datetime, inserted_at: :created_at, updated_at: :updated_at)
    end

    create_if_not_exists index(:agentlaunch_auctions, [:owner_address],
                           name: :agentlaunch_auctions_by_owner
                         )

    create_if_not_exists index(:agentlaunch_auctions, [:status],
                           name: :agentlaunch_auctions_by_status
                         )

    create_if_not_exists index(:agentlaunch_auctions, [:ends_at],
                           name: :agentlaunch_auctions_by_ends_at
                         )

    create_if_not_exists unique_index(:agentlaunch_auctions, [:network, :auction_address],
                           name: :agentlaunch_auctions_by_network_auction_address
                         )

    create_if_not_exists unique_index(:agentlaunch_auctions, [:source_job_id],
                           name: :agentlaunch_auctions_by_source_job_id
                         )
  end
end
