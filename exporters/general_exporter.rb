# app/exporters/general_exporter.rb
require_relative 'exporter_base'

class GeneralExporter < ExporterBase
  def export
    package = Axlsx::Package.new
    workbook = package.workbook
    
    styles = create_styles(workbook)
    
    workbook.add_worksheet(name: 'Пациенты') do |sheet|
      setup_page(sheet, :landscape)
      
      # Объединенные ячейки для заголовка отделения
      sheet.merge_cells("A1:J1")
      sheet.add_row ["Отделение: #{department_full}"], style: styles[:title_style]
      sheet.rows[0].height = 25
      
      # Объединенные ячейки для даты
      sheet.merge_cells("A2:J2")
      sheet.add_row ["Дата: #{@date}"], style: styles[:date_style]
      sheet.rows[1].height = 20
      
      sheet.add_row []
      
      # Заголовки столбцов
      header_row = sheet.add_row [
        '№ П',
        'ФИО пациента',
        'Дата рождения',
        'Где ребенок',
        'Дата родов',
        'Примечания',
        'иногор.',
        'У t',
        'О t',
        'В t'
      ], style: styles[:header_style]
      header_row.height = 30
      
      # Данные пациентов
      @patients.each do |patient|
        birth_date_str = patient.birth_date ? patient.birth_date.strftime('%d.%m.%Y') : ''
        birth_date_of_child_str = patient.birth_date_of_child ? patient.birth_date_of_child.strftime('%d.%m.%Y') : ''
        
        styles_row = [
          styles[:cell_style],      # № П
          styles[:wrap_cell_style], # ФИО
          styles[:cell_style],      # Дата рождения
          styles[:cell_style],      # Где ребенок
          styles[:cell_style],      # Дата родов
          styles[:wrap_cell_style], # Примечания
          styles[:cell_style],      # иногор.
          styles[:cell_style],      # У t
          styles[:cell_style],      # О t
          styles[:cell_style]       # В t
        ]
        
        data_row = [
          patient.room_number || '',
          patient.full_name || '',
          birth_date_str,
          patient.child_location || '',
          birth_date_of_child_str,
          patient.notes || '',
          patient.is_foreigner || '',
          patient.thermometry_u || '',
          patient.thermometry_o || '',
          patient.thermometry_v || ''
        ]
        
        current_row = sheet.add_row data_row, style: styles_row
        current_row.height = 15
      end
      
      sheet.column_widths 5, 28, 12, 10, 12, 18, 8, 5, 5, 5
      sheet.sheet_view.show_grid_lines = true
      sheet.sheet_view.zoom_scale = 100
    end
    
    package
  end
end