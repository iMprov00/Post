class ChangeIsForeignerToString < ActiveRecord::Migration[6.1]
  def change
    change_column :patients, :is_foreigner, :string
  end
end