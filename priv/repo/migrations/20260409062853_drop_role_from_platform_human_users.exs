defmodule PlatformPhx.Repo.Migrations.DropRoleFromPlatformHumanUsers do
  use Ecto.Migration

  def up do
    execute("""
    ALTER TABLE platform_human_users
      DROP COLUMN IF EXISTS role
    """)
  end

  def down do
  end
end
