class CreatePatients < ActiveRecord::Migration[6.1]
  def change
    create_table :patients do |t|
      t.string :department
      t.date :registration_date
      t.string :room_number
      t.string :full_name
      t.date :birth_date
      t.date :birth_date_of_child
      
      # Дополнительные поля для ручного заполнения
      t.string :child_location
      t.string :thermometry_u
      t.string :thermometry_o
      t.string :thermometry_v
      t.string :table_number
      t.boolean :is_foreigner, default: false
      t.string :notes
      
      t.timestamps
    end
    
    add_index :patients, [:department, :registration_date]
    add_index :patients, :full_name
  end
end