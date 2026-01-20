# app/exporters/canteen_exporter.rb
require_relative 'exporter_base'

class CanteenExporter < ExporterBase
  def export
    package = Axlsx::Package.new
    workbook = package.workbook
    
    styles = create_styles(workbook)
    
    workbook.add_worksheet(name: 'Столовая') do |sheet|
      setup_page(sheet, :portrait)
      
      sheet.merge_cells("A1:G1")
      sheet.add_row ["Отделение: #{department_full}"], style: styles[:title_style]
      sheet.rows[0].height = 25
      
      sheet.merge_cells("A2:G2")
      sheet.add_row ["Дата: #{@date}"], style: styles[:date_style]
      sheet.rows[1].height = 20
      
      sheet.add_row []
      
      sheet.add_row ['№ П', 'ФИО', 'Стол', '', '№ П', 'ФИО', 'Стол'], style: styles[:header_style]
      sheet.rows[3].height = 25
      
      # Разделяем пациентов на две части
      patient_count = @patients.count
      half_count = (patient_count.to_f / 2).ceil
      
      left_patients = @patients.limit(half_count)
      right_patients = @patients.offset(half_count)
      
      max_rows = [left_patients.count, right_patients.count].max
      
      (0...max_rows).each do |i|
        left_patient = left_patients[i]
        right_patient = right_patients[i]
        
        left_room = left_patient ? left_patient.room_number || '' : ''
        left_name = left_patient ? left_patient.full_name || '' : ''
        left_table = left_patient ? left_patient.table_number || '' : ''
        
        right_room = right_patient ? right_patient.room_number || '' : ''
        right_name = right_patient ? right_patient.full_name || '' : ''
        right_table = right_patient ? right_patient.table_number || '' : ''
        
        styles_row = [
          styles[:cell_style],      # Левая: № П
          styles[:wrap_cell_style], # Левая: ФИО
          styles[:cell_style],      # Левая: Стол
          nil,                      # Разделитель
          styles[:cell_style],      # Правая: № П
          styles[:wrap_cell_style], # Правая: ФИО
          styles[:cell_style]       # Правая: Стол
        ]
        
        data_row = [
          left_room,
          left_name,
          left_table,
          '',
          right_room,
          right_name,
          right_table
        ]
        
        current_row = sheet.add_row data_row, style: styles_row
        
        row_height = if left_name.length > 30 || right_name.length > 30
                       18
                     else
                       15
                     end
        current_row.height = row_height
      end
      
      sheet.column_widths 6, 25, 6, 2, 6, 25, 6
      sheet.sheet_view.show_grid_lines = true
      sheet.sheet_view.zoom_scale = 100
    end
    
    package
  end
end