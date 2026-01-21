class AddContractToPatients < ActiveRecord::Migration[6.1]
  def change
    add_column :patients, :contract, :boolean, default: false
  end
end