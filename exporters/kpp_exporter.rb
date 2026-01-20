# app/exporters/kpp_exporter.rb
require_relative 'exporter_base'

class KPPExporter < ExporterBase
  def export
    package = Axlsx::Package.new
    workbook = package.workbook
    
    styles = create_styles(workbook)
    
    workbook.add_worksheet(name: 'КПП') do |sheet|
      setup_page(sheet, :portrait)
      
      # Объединенные ячейки на всю ширину (5 колонок)
      sheet.merge_cells("A1:E1")
      sheet.add_row ["Отделение: #{department_full}"], style: styles[:title_style]
      sheet.rows[0].height = 25
      
      sheet.merge_cells("A2:E2")
      sheet.add_row ["Дата: #{@date}"], style: styles[:date_style]
      sheet.rows[1].height = 20
      
      sheet.add_row []
      
      # Заголовки для левой и правой таблиц (только 2 колонки: № П и ФИО)
      sheet.add_row ['№ П', 'ФИО', '', '№ П', 'ФИО'], style: styles[:header_style]
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
        
        right_room = right_patient ? right_patient.room_number || '' : ''
        right_name = right_patient ? right_patient.full_name || '' : ''
        
        styles_row = [
          styles[:cell_style],      # Левая: № П
          styles[:wrap_cell_style], # Левая: ФИО
          nil,                      # Пустая колонка-разделитель (без стиля)
          styles[:cell_style],      # Правая: № П
          styles[:wrap_cell_style]  # Правая: ФИО
        ]
        
        data_row = [
          left_room,
          left_name,
          '',  # Пустая колонка-разделитель
          right_room,
          right_name
        ]
        
        current_row = sheet.add_row data_row, style: styles_row
        
        # Устанавливаем высоту строки
        row_height = if left_name.length > 30 || right_name.length > 30
                       18
                     else
                       15
                     end
        current_row.height = row_height
      end
      
      # Настраиваем ширину колонок
      # Левая таблица: A, B
      # Правая таблица: D, E
      # Колонка C (индекс 2) - разделитель
      sheet.column_widths 6,   # A: № П (левая)
                          30,  # B: ФИО (левая) - немного шире, так как нет колонки "Стол"
                          2,   # C: Разделитель (узкая пустая колонка)
                          6,   # D: № П (правая)
                          30   # E: ФИО (правая) - немного шире
      
      sheet.sheet_view.show_grid_lines = true
      sheet.sheet_view.zoom_scale = 100
    end
    
    package
  end
end